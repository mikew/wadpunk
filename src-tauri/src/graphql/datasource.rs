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
use crate::database::DbPlaySession;
use crate::database::DbPlaySessionEntry;
use crate::database::DbPreviousFileStateItem;
use crate::database::DbSourcePort;
use crate::graphql::generated::AppInfo;
use crate::importer;
use crate::tauri_helpers::reveal_in_finder::reveal_file_or_folder;

use super::generated::AppSettings;
use super::generated::CreateSourcePortInput;
use super::generated::Game;
use super::generated::GameFileEntry;
use super::generated::GameInput;
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
      .join(&root.name)
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
    Ok(database::load_game_with_meta(&id).to_game())
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
    files: Option<Vec<String>>,
    game_id: String,
    iwad: Option<String>,
    source_port: String,
    use_custom_config: Option<bool>,
  ) -> GraphQLResult<bool> {
    let db_source_port = database::find_source_port_by_id(source_port);
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

    let mut command = Command::new(main_exe);
    command.args(base_args);

    if let Some(valid_iwad) = iwad {
      command.args(["-iwad", &valid_iwad]);
    }

    if let Some(valid_files) = files {
      for valid_file in valid_files {
        // If the file ends with .deh, add `-deh <file>`, if the file ends with
        // .bex, add `-bex <file>`, otherwise just add `-file <file>`
        // I really don't like Rust.
        let file_extension = Path::new(&valid_file)
          .extension()
          .unwrap_or_default()
          .to_str()
          .unwrap_or_default()
          .to_lowercase();

        match file_extension.as_str() {
          "deh" => {
            command.args(["-deh", &valid_file]);
          }
          "bex" => {
            command.args(["-bex", &valid_file]);
          }
          _ => {
            command.args(["-file", &valid_file]);
          }
        }
      }
    }

    if let Some(use_custom_config) = use_custom_config {
      if use_custom_config {
        command.args([
          "-config",
          database::get_meta_directory()
            .join(database::normalize_name_from_id(&game_id))
            .join("config.ini")
            .to_str()
            .unwrap(),
        ]);
      }
    }

    command.args([
      "-savedir",
      database::get_meta_directory()
        .join(database::normalize_name_from_id(&game_id))
        .join("saves")
        .to_str()
        .unwrap(),
    ]);

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
      db_game.rating = game.rating;
      db_game.description = game.description;
      db_game.notes = game.notes;
      db_game.tags = game.tags;

      db_game.source_port = game.source_port;
      db_game.iwad_id = game.iwad_id;
      db_game.extra_mod_ids = game.extra_mod_ids;

      db_game.use_custom_config = game.use_custom_config;
      db_game.previous_file_state = Some(
        game
          .previous_file_state
          .into_iter()
          .flatten()
          .map(|x| DbPreviousFileStateItem {
            is_enabled: x.is_enabled,
            relative: x.relative,
            absolute: x.absolute,
          })
          .collect(),
      );

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
      id: Some(source_port.id),
      command: Some(source_port.command),
    };

    database::save_source_port(db_source_port.clone());

    Ok(db_source_port.to_source_port())
  }

  pub async fn Mutation_updateSourcePort(
    &self,
    _root: &Mutation,
    _ctx: &Context<'_>,
    source_port: UpdateSourcePortInput,
  ) -> GraphQLResult<SourcePort> {
    let mut db_source_port = database::find_source_port_by_id(source_port.id);

    db_source_port.command = Some(source_port.command);

    database::save_source_port(db_source_port.clone());

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
    _ctx: &Context<'_>,
    file_path: String,
  ) -> GraphQLResult<bool> {
    importer::import_file(&file_path);

    Ok(true)
  }
}
