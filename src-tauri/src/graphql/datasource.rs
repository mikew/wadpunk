use std::fs;
use std::path::Path;
use std::process::Command;
use std::vec;

use async_graphql::Context;
use async_graphql::Error;
use async_graphql::Result as GraphQLResult;
use chrono::DateTime;
use chrono::Utc;

use plist;
use tauri::AppHandle;

use crate::database;
use crate::database::normalize_name_from_id;
use crate::database::DbPlaySession;
use crate::database::DbPlaySessionEntry;
use crate::database::DbPreviousFileStateItem;
use crate::database::DbSourcePort;
use crate::graphql::generated::AppInfo;
use crate::importer;
use crate::known_source_ports;
use crate::known_source_ports::find_known_source_port_from_id;
use crate::known_source_ports::BuildCommandArgs;
use crate::tauri_helpers::reveal_in_finder::reveal_file_or_folder;

use super::generated::AppSettings;
use super::generated::CreateSourcePortInput;
use super::generated::Game;
use super::generated::GameFileEntry;
use super::generated::GameInput;
use super::generated::KnownSourcePort;
use super::generated::Mutation;
use super::generated::PlaySession;
use super::generated::PreviousFileStateItem;
use super::generated::Query;
use super::generated::SourcePort;
use super::generated::UpdateSourcePortInput;

pub struct DataSource;

impl DataSource {
  pub async fn Game_play_sessions(
    &self,
    root: &Game,
    _ctx: &Context<'_>,
  ) -> GraphQLResult<Vec<PlaySession>> {
    let mut gql_play_sessions: Vec<PlaySession> = vec![];

    let meta_path = database::get_meta_directory()
      .join(normalize_name_from_id(&root.id))
      .join("playSessions.json");
    let json_contents = fs::read_to_string(meta_path).unwrap_or("{}".to_string());
    let play_session_meta = serde_json::from_str::<DbPlaySession>(&json_contents).unwrap();

    if let Some(play_sessions) = play_session_meta.sessions {
      for play_session in play_sessions {
        if let Some(started_at) = play_session.started_at {
          if let Some(ended_at) = play_session.ended_at {
            let duration: i32 = (DateTime::parse_from_rfc3339(&ended_at).unwrap()
              - DateTime::parse_from_rfc3339(&started_at).unwrap())
            .num_seconds()
            .try_into()
            .unwrap();

            gql_play_sessions.push(PlaySession {
              duration,
              ended_at,
              started_at,
            })
          }
        }
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
      database::load_game_meta(&root.id)
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
    Ok(database::load_game_meta(&id).to_game())
  }

  pub async fn Query_getAppSettings(
    &self,
    _root: &Query,
    _ctx: &Context<'_>,
  ) -> GraphQLResult<AppSettings> {
    Ok(AppSettings {
      dataDirectory: String::from(database::get_data_directory().to_str().unwrap()),
    })
  }

  pub async fn Query_getGameFiles(
    &self,
    _root: &Query,
    _ctx: &Context<'_>,
    game_ids: Vec<String>,
  ) -> GraphQLResult<Vec<GameFileEntry>> {
    let mut game_file_entries: Vec<GameFileEntry> = vec![];

    for game_id in game_ids {
      let game_files = database::find_all_game_files(&game_id);

      for game_file in game_files {
        game_file_entries.push(GameFileEntry {
          absolute: game_file.clone(),
          relative: Path::new(&game_file)
            .strip_prefix(database::get_games_directory())
            .unwrap()
            .to_str()
            .unwrap()
            .to_string(),
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
      database::find_all_games()
        .into_iter()
        .map(|x| x.to_game())
        .collect(),
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
        .collect(),
    )
  }

  pub async fn Query_getSourcePorts(
    &self,
    _root: &Query,
    _ctx: &Context<'_>,
  ) -> GraphQLResult<Vec<SourcePort>> {
    Ok(
      database::find_all_source_ports()
        .into_iter()
        .map(|x| x.to_source_port())
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
    let game = database::find_game_by_id(&game_id).ok_or_else(|| Error {
      message: format!("game {} not found", game_id),
      source: None,
      extensions: None,
    })?;

    // Get source port configuration
    let db_source_port = if game.source_port.as_deref() == Some("-1") {
      // Find the default source port or fall back to first one
      let all_source_ports = database::find_all_source_ports();
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
      database::find_source_port_by_id(&source_port)
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
      &db_source_port
        .known_source_port_id
        .unwrap_or("gzdoom".to_string()),
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
      game.iwad_id.ok_or_else(|| Error {
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
      executable: main_exe,
      game_id: game_id.clone(),
      iwad,
      files,
      use_custom_config,
    });

    let mut command = Command::new(&args[0]);
    command.args(base_args);
    command.args(&args[1..]);

    let mut play_session = DbPlaySessionEntry {
      started_at: Some(Utc::now().to_rfc3339()),
      ended_at: None,
    };

    let exit_status = command.status().unwrap();

    play_session.ended_at = Some(Utc::now().to_rfc3339());

    database::record_game_play_session(&game_id, play_session);

    Ok(exit_status.success())
  }

  pub async fn Mutation_openGamesFolder(
    &self,
    _root: &Mutation,
    _ctx: &Context<'_>,
    game_id: Option<String>,
  ) -> GraphQLResult<bool> {
    let mut path_to_open = database::get_games_directory();

    if let Some(game_id) = game_id {
      path_to_open.push(game_id);
    }

    reveal_file_or_folder(path_to_open.to_str().unwrap());

    Ok(true)
  }

  pub async fn Mutation_openSourcePortsFolder(
    &self,
    _root: &Mutation,
    _ctx: &Context<'_>,
    _game_id: Option<String>,
  ) -> GraphQLResult<bool> {
    reveal_file_or_folder(database::get_source_ports_directory().to_str().unwrap());

    Ok(true)
  }

  pub async fn Mutation_updateNotes(
    &self,
    _root: &Mutation,
    _ctx: &Context<'_>,
    game_id: String,
    notes: String,
  ) -> GraphQLResult<Game> {
    if let Some(mut db_game) = database::find_game_by_id(&game_id) {
      db_game.notes = Some(notes);

      database::save_game(db_game.clone());

      return Ok(db_game.to_game());
    }

    Err(Error {
      message: format!("game {} not found", game_id),
      source: None,
      extensions: None,
    })
  }

  pub async fn Mutation_updateRating(
    &self,
    _root: &Mutation,
    _ctx: &Context<'_>,
    game_id: String,
    rating: i32,
  ) -> GraphQLResult<Game> {
    if let Some(mut db_game) = database::find_game_by_id(&game_id) {
      db_game.rating = Some(rating);

      database::save_game(db_game.clone());

      return Ok(db_game.to_game());
    }

    Err(Error {
      message: format!("game {} not found", game_id),
      source: None,
      extensions: None,
    })
  }

  pub async fn Mutation_updateTags(
    &self,
    _root: &Mutation,
    _ctx: &Context<'_>,
    game_id: String,
    tags: Vec<String>,
  ) -> GraphQLResult<Game> {
    if let Some(mut db_game) = database::find_game_by_id(&game_id) {
      db_game.tags = Some(tags);

      database::save_game(db_game.clone());

      return Ok(db_game.to_game());
    }

    Err(Error {
      message: format!("game {} not found", game_id),
      source: None,
      extensions: None,
    })
  }

  pub async fn Mutation_updateGame(
    &self,
    _root: &Mutation,
    _ctx: &Context<'_>,
    game: GameInput,
  ) -> GraphQLResult<Game> {
    if let Some(mut db_game) = database::find_game_by_id(&game.id) {
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

      database::save_game(db_game.clone());

      return Ok(db_game.to_game());
    }

    Err(Error {
      message: format!("game {} not found", game.id),
      source: None,
      extensions: None,
    })
  }

  pub async fn Mutation_initializeApp(
    &self,
    _root: &Mutation,
    _ctx: &Context<'_>,
  ) -> GraphQLResult<bool> {
    database::init_games();

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

    database::save_source_port(db_source_port.clone());
    database::set_default_source_port(&source_port.id, source_port.is_default);

    Ok(db_source_port.to_source_port())
  }

  pub async fn Mutation_updateSourcePort(
    &self,
    _root: &Mutation,
    _ctx: &Context<'_>,
    source_port: UpdateSourcePortInput,
  ) -> GraphQLResult<SourcePort> {
    let mut db_source_port = database::find_source_port_by_id(&source_port.id);

    db_source_port.command = Some(source_port.command);
    db_source_port.known_source_port_id = Some(source_port.known_source_port_id);
    db_source_port.is_default = source_port.is_default;

    database::save_source_port(db_source_port.clone());
    database::set_default_source_port(&source_port.id, source_port.is_default);

    Ok(db_source_port.to_source_port())
  }

  pub async fn Mutation_deleteSourcePort(
    &self,
    _root: &Mutation,
    _ctx: &Context<'_>,
    id: String,
  ) -> GraphQLResult<bool> {
    database::delete_source_port(&id);

    Ok(true)
  }

  pub async fn Mutation_importFile(
    &self,
    _root: &Mutation,
    ctx: &Context<'_>,
    file_path: String,
  ) -> GraphQLResult<bool> {
    let app_handle = ctx.data_unchecked::<AppHandle>();

    let seven_zip_path = app_handle
      .path_resolver()
      .resolve_resource(add_exe_on_windows("resources-arch-specific/7za"))
      .unwrap();

    let seven_zip_path_str = seven_zip_path.to_str().unwrap();

    importer::import_file(&file_path, seven_zip_path_str);

    Ok(true)
  }
}

pub fn add_exe_on_windows(exe: &str) -> String {
  if cfg!(target_os = "windows") {
    format!("{}.exe", exe)
  } else {
    exe.to_string()
  }
}
