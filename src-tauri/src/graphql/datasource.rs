use std::path::Path;
use std::path::PathBuf;
use std::process::Command;
use std::vec;

use async_graphql::Context;
use async_graphql::Error;
use async_graphql::Result as GraphQLResult;
use chrono::DateTime;
use chrono::Utc;

use plist;
use tauri::AppHandle;
use tauri::Manager;

use crate::database;
use crate::database::DbModSet;
use crate::database::DbPlaySessionEntry;
use crate::database::DbPreviousFileStateItem;
use crate::database::DbSourcePort;
use crate::error::Error as AppError;
use crate::graphql::generated::AppInfo;
use crate::graphql::generated::ImportFileResponse;
use crate::importer;
use crate::known_source_ports;
use crate::known_source_ports::find_known_source_port_from_id;
use crate::known_source_ports::BuildCommandArgs;
use crate::tauri_helpers::reveal_in_finder::reveal_file_or_folder;
use crate::tauri_plugin_downloader::tauri_download::download;

use super::generated::AppSettings;
use super::generated::CreateModSetInput;
use super::generated::CreateSourcePortInput;
use super::generated::DownloadGameResponse;
use super::generated::Game;
use super::generated::GameFileEntry;
use super::generated::GameInput;
use super::generated::KnownSourcePort;
use super::generated::ModSet;
use super::generated::Mutation;
use super::generated::PlaySession;
use super::generated::PreviousFileStateItem;
use super::generated::Query;
use super::generated::SourcePort;
use super::generated::UpdateModSetInput;
use super::generated::UpdateSourcePortInput;

pub struct DataSource;

impl DataSource {
  pub async fn Game_play_sessions(
    &self,
    root: &Game,
    _ctx: &Context<'_>,
  ) -> GraphQLResult<Vec<PlaySession>> {
    let mut gql_play_sessions: Vec<PlaySession> = vec![];

    let play_session_meta = database::load_game_play_sessions(&root.id)?;

    for play_session in play_session_meta.sessions.into_iter().flatten() {
      let (Some(started_at), Some(ended_at)) = (play_session.started_at, play_session.ended_at)
      else {
        continue;
      };

      match play_session_duration(&started_at, &ended_at) {
        Ok(duration) => gql_play_sessions.push(PlaySession {
          duration,
          ended_at,
          started_at,
          passive: play_session.passive.unwrap_or(false),
        }),
        Err(error) => eprintln!("Skipping a play session of {}: {}", root.id, error),
      }
    }

    Ok(gql_play_sessions)
  }

  pub async fn Game_previous_file_state(
    &self,
    root: &Game,
    _ctx: &Context<'_>,
  ) -> GraphQLResult<Vec<PreviousFileStateItem>> {
    Ok(
      database::load_game_meta(&root.id)?
        .previous_file_state
        .into_iter()
        .flatten()
        .map(|x| PreviousFileStateItem {
          absolute: x.absolute,
          relative: x.relative,
          is_enabled: x.is_enabled,
        })
        .collect(),
    )
  }

  pub async fn Query_getGame(
    &self,
    _root: &Query,
    _ctx: &Context<'_>,
    id: String,
  ) -> GraphQLResult<Game> {
    Ok(database::load_game_meta(&id)?.into_game()?)
  }

  pub async fn Query_getAppSettings(
    &self,
    _root: &Query,
    _ctx: &Context<'_>,
  ) -> GraphQLResult<AppSettings> {
    Ok(AppSettings {
      dataDirectory: database::path_to_str(&database::get_data_directory()?)?.to_string(),
    })
  }

  pub async fn Query_getGameFiles(
    &self,
    _root: &Query,
    _ctx: &Context<'_>,
    game_ids: Vec<String>,
  ) -> GraphQLResult<Vec<GameFileEntry>> {
    let mut game_file_entries: Vec<GameFileEntry> = vec![];

    let games_directory = database::get_games_directory()?;

    for game_id in game_ids {
      for game_file in database::find_all_game_files(&game_id)? {
        let relative = Path::new(&game_file)
          .strip_prefix(&games_directory)
          .map_err(|_| AppError::OutsideGamesFolder(PathBuf::from(&game_file)))?;
        let relative = database::path_to_str(relative)?.to_string();

        game_file_entries.push(GameFileEntry {
          absolute: game_file,
          relative,
        })
      }
    }

    Ok(game_file_entries)
  }

  pub async fn Query_getGames(
    &self,
    _root: &Query,
    _ctx: &Context<'_>,
  ) -> GraphQLResult<Vec<Game>> {
    Ok(
      database::find_all_games()?
        .into_iter()
        .map(|x| x.into_game())
        .collect::<Result<_, _>>()?,
    )
  }

  pub async fn Query_getKnownSourcePorts(
    &self,
    _root: &Query,
    _ctx: &Context<'_>,
  ) -> GraphQLResult<Vec<KnownSourcePort>> {
    Ok(
      known_source_ports::get_all_known_source_ports()
        .into_iter()
        .map(|x| x.to_known_source_port())
        .collect::<Result<_, _>>()?,
    )
  }

  pub async fn Query_getStarterSourcePort(
    &self,
    _root: &Query,
    _ctx: &Context<'_>,
  ) -> GraphQLResult<KnownSourcePort> {
    Ok(known_source_ports::get_starter_source_port().to_known_source_port()?)
  }

  pub async fn Query_getSourcePorts(
    &self,
    _root: &Query,
    _ctx: &Context<'_>,
  ) -> GraphQLResult<Vec<SourcePort>> {
    Ok(
      database::find_all_source_ports()?
        .into_iter()
        .map(|x| x.into_source_port())
        .collect::<Result<_, _>>()?,
    )
  }

  pub async fn Query_getModSets(
    &self,
    _root: &Query,
    _ctx: &Context<'_>,
  ) -> GraphQLResult<Vec<ModSet>> {
    Ok(
      database::find_all_mod_sets()?
        .iter()
        .map(|x| x.to_mod_set())
        .collect(),
    )
  }

  pub async fn Query_getAppInfo(&self, _root: &Query, ctx: &Context<'_>) -> GraphQLResult<AppInfo> {
    let app_handle = ctx.data_unchecked::<AppHandle>();
    let package_info = app_handle.package_info();

    Ok(AppInfo {
      name: package_info.name.to_string(),
      version: package_info.version.to_string(),
    })
  }

  pub async fn Mutation_startGame(
    &self,
    _root: &Mutation,
    _ctx: &Context<'_>,
    game_id: String,
  ) -> GraphQLResult<bool> {
    // Get game configuration from database
    let game = database::find_game_by_id(&game_id)?;

    // Get source port configuration
    let db_source_port = if game.source_port.as_deref() == Some("-1") {
      // Find the default source port or fall back to first one
      let all_source_ports = database::find_all_source_ports()?;
      if all_source_ports.is_empty() {
        return Err(Error {
          message: "No source ports configured".to_string(),
          source: None,
          extensions: None,
        });
      }
      all_source_ports
        .clone()
        .into_iter()
        .find(|sp| sp.is_default.unwrap_or(false))
        .unwrap_or_else(|| all_source_ports.into_iter().next().unwrap())
    } else {
      // Use the specified source port
      let source_port = game.source_port.ok_or_else(|| Error {
        message: format!("game {} has no source port configured", game_id),
        source: None,
        extensions: None,
      })?;
      database::find_source_port_by_id(&source_port)?
    };

    let db_source_port_command = db_source_port.command.unwrap();
    let main_exe = db_source_port_command.first().unwrap().clone();
    let base_args = &db_source_port_command[1..];

    // If running on macOS, check if the `${source_port}/Contents/Info.plist`
    // exists.
    // If it does, we need to get `CFBundleExecutable` from it and run
    // `${source_port}/Contents/MacOS/${CFBundleExecutable}`
    let main_exe = if cfg!(target_os = "macos") {
      let plist_path = Path::new(&main_exe).join("Contents").join("Info.plist");

      if plist_path.exists() {
        let info_plist = plist::Value::from_file(&plist_path).unwrap();
        let executable = info_plist
          .as_dictionary()
          .and_then(|x| x.get("CFBundleExecutable"))
          .and_then(|x| x.as_string())
          .unwrap();

        plist_path
          .parent()
          .unwrap()
          .join("MacOS")
          .join(executable)
          .to_str()
          .unwrap()
          .to_string()
      } else {
        main_exe
      }
    } else {
      main_exe
    };

    let source_port_definition = find_known_source_port_from_id(
      &db_source_port.known_source_port_id.unwrap_or(
        known_source_ports::get_starter_source_port()
          .id()
          .to_string(),
      ),
    );

    // Check if this game is tagged as an IWAD
    let is_game_iwad = game
      .tags
      .iter()
      .flat_map(|tags| tags.iter())
      .any(|tag| tag.to_lowercase() == "iwad");

    // Get the IWAD ID - if game is tagged as IWAD, use its own ID,
    // otherwise use configured IWAD
    let iwad_id = if is_game_iwad {
      game_id.clone()
    } else {
      game.iwad_id.clone().ok_or_else(|| Error {
        message: format!("game {} has no IWAD configured", game_id),
        source: None,
        extensions: None,
      })?
    };

    // Process enabled files from previous_file_state
    let mut files = Vec::new();
    let mut iwad = None;

    if let Some(state) = game.previous_file_state {
      for file in state.into_iter().filter(|item| item.is_enabled) {
        // If this file's relative path starts with the iwad_id and we haven't
        // found an IWAD yet
        if file.relative.starts_with(&iwad_id) && iwad.is_none() {
          iwad = Some(file.absolute.clone());
        }
        // Add all files to the files list, including IWAD files
        files.push(file.absolute);
      }
    }

    // Ensure we found an IWAD
    let iwad = iwad.ok_or_else(|| Error {
      message: format!("game {} has no enabled IWAD files", game_id),
      source: None,
      extensions: None,
    })?;

    let use_custom_config = game.use_custom_config.unwrap_or_default();

    let args = source_port_definition.build_command(&BuildCommandArgs {
      executable: &main_exe,
      game_id: &game_id,
      iwad: &iwad,
      files: &files,
      use_custom_config,
    })?;

    let mut command = Command::new(&args[0]);

    // Set LD_LIBRARY_PATH for Linux / AppImage.
    if cfg!(target_os = "linux") {
      let ld_library_path = std::env::var("LD_LIBRARY_PATH").unwrap_or_default();
      let new_ld_library_path = format!("/usr/lib:{}", ld_library_path);
      command.env("LD_LIBRARY_PATH", new_ld_library_path);
    }

    command.args(base_args);
    command.args(&args[1..]);

    let mut play_session = DbPlaySessionEntry {
      started_at: Some(Utc::now().to_rfc3339()),
      ended_at: None,
      passive: Some(false),
    };

    let exit_status = command.status().unwrap();

    play_session.ended_at = Some(Utc::now().to_rfc3339());

    database::record_game_play_session(&game_id, &play_session)?;

    let mut passive_play_session = play_session.clone();
    passive_play_session.passive = Some(true);

    if let Some(iwad_id) = &game.iwad_id {
      database::record_game_play_session(iwad_id, &passive_play_session)?;
    }

    if let Some(extra_mod_ids) = &game.extra_mod_ids {
      for mod_id in extra_mod_ids {
        database::record_game_play_session(mod_id, &passive_play_session)?;
      }
    }

    Ok(exit_status.success())
  }

  pub async fn Mutation_openGamesFolder(
    &self,
    _root: &Mutation,
    _ctx: &Context<'_>,
    game_id: Option<String>,
  ) -> GraphQLResult<bool> {
    let mut path_to_open = database::get_games_directory()?;

    if let Some(game_id) = game_id {
      path_to_open.push(game_id);
    }

    reveal_file_or_folder(database::path_to_str(&path_to_open)?);

    Ok(true)
  }

  pub async fn Mutation_openSourcePortsFolder(
    &self,
    _root: &Mutation,
    _ctx: &Context<'_>,
    _game_id: Option<String>,
  ) -> GraphQLResult<bool> {
    reveal_file_or_folder(database::path_to_str(
      &database::get_source_ports_directory()?,
    )?);

    Ok(true)
  }

  pub async fn Mutation_updateNotes(
    &self,
    _root: &Mutation,
    _ctx: &Context<'_>,
    game_id: String,
    notes: String,
  ) -> GraphQLResult<Game> {
    let mut db_game = database::find_game_by_id(&game_id)?;
    db_game.notes = Some(notes);

    database::save_game(&db_game)?;

    Ok(db_game.into_game()?)
  }

  pub async fn Mutation_updateRating(
    &self,
    _root: &Mutation,
    _ctx: &Context<'_>,
    game_id: String,
    rating: i32,
  ) -> GraphQLResult<Game> {
    let mut db_game = database::find_game_by_id(&game_id)?;
    db_game.rating = Some(rating);

    database::save_game(&db_game)?;

    Ok(db_game.into_game()?)
  }

  pub async fn Mutation_updateTags(
    &self,
    _root: &Mutation,
    _ctx: &Context<'_>,
    game_id: String,
    tags: Vec<String>,
  ) -> GraphQLResult<Game> {
    let mut db_game = database::find_game_by_id(&game_id)?;
    db_game.tags = Some(tags);

    database::save_game(&db_game)?;

    Ok(db_game.into_game()?)
  }

  pub async fn Mutation_updateGame(
    &self,
    _root: &Mutation,
    _ctx: &Context<'_>,
    game: GameInput,
  ) -> GraphQLResult<Game> {
    let mut db_game = database::find_game_by_id(&game.id)?;

    if let Some(rating) = game.rating {
      db_game.rating = Some(rating);
    }
    if let Some(description) = game.description {
      db_game.description = Some(description);
    }
    if let Some(notes) = game.notes {
      db_game.notes = Some(notes);
    }
    if let Some(tags) = game.tags {
      db_game.tags = Some(tags);
    }

    if let Some(source_port) = game.source_port {
      db_game.source_port = Some(source_port);
    }
    if let Some(iwad_id) = game.iwad_id {
      db_game.iwad_id = Some(iwad_id);
    }
    if let Some(extra_mod_ids) = game.extra_mod_ids {
      db_game.extra_mod_ids = Some(extra_mod_ids);
    }

    if let Some(use_custom_config) = game.use_custom_config {
      db_game.use_custom_config = Some(use_custom_config);
    }
    if let Some(previous_file_state) = game.previous_file_state {
      db_game.previous_file_state = Some(
        previous_file_state
          .into_iter()
          .map(|x| DbPreviousFileStateItem {
            is_enabled: x.is_enabled,
            relative: x.relative,
            absolute: x.absolute,
          })
          .collect(),
      );
    }

    database::save_game(&db_game)?;

    Ok(db_game.into_game()?)
  }

  pub async fn Mutation_initializeApp(
    &self,
    _root: &Mutation,
    _ctx: &Context<'_>,
  ) -> GraphQLResult<bool> {
    database::init_games()?;

    Ok(true)
  }

  pub async fn Mutation_createSourcePort(
    &self,
    _root: &Mutation,
    _ctx: &Context<'_>,
    source_port: CreateSourcePortInput,
  ) -> GraphQLResult<SourcePort> {
    let db_source_port = DbSourcePort {
      id: Some(source_port.id.clone()),
      command: Some(source_port.command),
      known_source_port_id: Some(source_port.known_source_port_id),
      is_default: source_port.is_default,
    };

    database::save_source_port(&db_source_port)?;
    database::set_default_source_port(&source_port.id, source_port.is_default)?;

    Ok(db_source_port.into_source_port()?)
  }

  pub async fn Mutation_updateSourcePort(
    &self,
    _root: &Mutation,
    _ctx: &Context<'_>,
    source_port: UpdateSourcePortInput,
  ) -> GraphQLResult<SourcePort> {
    let mut db_source_port = database::find_source_port_by_id(&source_port.id)?;

    db_source_port.command = Some(source_port.command);
    db_source_port.known_source_port_id = Some(source_port.known_source_port_id);
    db_source_port.is_default = source_port.is_default;

    database::save_source_port(&db_source_port)?;
    database::set_default_source_port(&source_port.id, source_port.is_default)?;

    Ok(db_source_port.into_source_port()?)
  }

  pub async fn Mutation_deleteSourcePort(
    &self,
    _root: &Mutation,
    _ctx: &Context<'_>,
    id: String,
  ) -> GraphQLResult<bool> {
    database::delete_source_port(&id)?;

    Ok(true)
  }

  pub async fn Mutation_createModSet(
    &self,
    _root: &Mutation,
    _ctx: &Context<'_>,
    mod_set: CreateModSetInput,
  ) -> GraphQLResult<ModSet> {
    let db_mod_set = DbModSet {
      name: Some(mod_set.name),
      mods: Some(mod_set.mods),
    };

    let result = db_mod_set.to_mod_set();
    database::save_mod_set(db_mod_set)?;

    Ok(result)
  }

  pub async fn Mutation_updateModSet(
    &self,
    _root: &Mutation,
    _ctx: &Context<'_>,
    mod_set: UpdateModSetInput,
  ) -> GraphQLResult<ModSet> {
    let db_mod_set = DbModSet {
      name: Some(mod_set.name),
      mods: Some(mod_set.mods),
    };

    let result = db_mod_set.to_mod_set();
    database::save_mod_set(db_mod_set)?;

    Ok(result)
  }

  pub async fn Mutation_deleteModSet(
    &self,
    _root: &Mutation,
    _ctx: &Context<'_>,
    name: String,
  ) -> GraphQLResult<bool> {
    database::delete_mod_set(&name)?;

    Ok(true)
  }

  pub async fn Mutation_importFile(
    &self,
    _root: &Mutation,
    ctx: &Context<'_>,
    file_path: String,
  ) -> GraphQLResult<ImportFileResponse> {
    let app_handle = ctx.data_unchecked::<AppHandle>();

    let seven_zip_path = app_handle
      .path()
      .resource_dir()?
      .join(add_exe_on_windows("resources-arch-specific/7za"));

    let seven_zip_path_str = database::path_to_str(&seven_zip_path)?;

    let game_id = importer::import_file(&file_path, seven_zip_path_str)?;

    Ok(ImportFileResponse {
      success: true,
      message: Some(format!("Game imported with ID: {}", game_id)),
      game_id: Some(game_id),
    })
  }

  pub async fn Mutation_downloadGame(
    &self,
    _root: &Mutation,
    _ctx: &Context<'_>,
    hint: Option<String>,
    host: String,
  ) -> GraphQLResult<DownloadGameResponse> {
    if host == "idgames" {
      if let Some(hint) = hint {
        // Get the details from `https://www.doomworld.com/idgames/api/api.php?action=get&id=<id>`
        let url = format!(
          "https://www.doomworld.com/idgames/api/api.php?action=get&id={}",
          hint
        );
        let response = reqwest::get(&url).await.map_err(|e| Error {
          message: e.to_string(),
          source: None,
          extensions: None,
        })?;
        if !response.status().is_success() {
          return Err(Error {
            message: format!("Failed to fetch game details: {}", response.status()),
            source: None,
            extensions: None,
          });
        }

        // They're XML, and we need to get `idgames-response.content.dir` and
        // `idgames-response.content.file`.
        let xml_content = response.text().await.map_err(|e| Error {
          message: e.to_string(),
          source: None,
          extensions: None,
        })?;
        let doc = roxmltree::Document::parse(&xml_content).map_err(|e| Error {
          message: e.to_string(),
          source: None,
          extensions: None,
        })?;
        let dir = doc
          .descendants()
          .find(|n| n.has_tag_name("dir"))
          .and_then(|n| n.text())
          .ok_or_else(|| Error {
            message: "Failed to find 'dir' in XML response".to_string(),
            source: None,
            extensions: None,
          })?;
        let file = doc
          .descendants()
          .find(|n| n.has_tag_name("filename"))
          .and_then(|n| n.text())
          .ok_or_else(|| Error {
            message: "Failed to find 'filename' in XML response".to_string(),
            source: None,
            extensions: None,
          })?;

        // The download URL is `https://youfailit.net/pub/idgames/<dir>/<file>`
        let download_url = format!("https://youfailit.net/pub/idgames/{}/{}", dir, file);

        // use mktemp to create a temporary directory
        let temp_dir = mktemp::Temp::new_dir().map_err(|e| Error {
          message: e.to_string(),
          source: None,
          extensions: None,
        })?;

        // Create a path for the downloaded file
        let download_path = temp_dir.release().join(file);
        let headers = std::collections::HashMap::new();
        let body = None;
        let download_path_str = database::path_to_str(&download_path)?;
        download(&download_url, download_path_str, headers, body)
          .await
          .map_err(|e| Error {
            message: e.to_string(),
            source: None,
            extensions: None,
          })?;

        return Ok(DownloadGameResponse {
          success: true,
          message: Some(format!(
            "Game downloaded successfully to {}",
            download_path_str
          )),
          temp_path: Some(download_path_str.to_string()),
        });
      }
    }

    Ok(DownloadGameResponse {
      success: false,
      message: None,
      temp_path: None,
    })
  }
}

pub fn add_exe_on_windows(exe: &str) -> String {
  if cfg!(target_os = "windows") {
    format!("{}.exe", exe)
  } else {
    exe.to_string()
  }
}

fn play_session_duration(
  started_at: &str,
  ended_at: &str,
) -> Result<i32, Box<dyn std::error::Error>> {
  let seconds = (DateTime::parse_from_rfc3339(ended_at)?
    - DateTime::parse_from_rfc3339(started_at)?)
  .num_seconds();

  Ok(i32::try_from(seconds)?)
}
