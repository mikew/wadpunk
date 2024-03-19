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

use crate::database;
use crate::database::DbPlaySession;
use crate::database::DbPlaySessionEntry;
use crate::tauri_helpers::reveal_in_finder::reveal_file_or_folder;

use super::generated::AppSettings;
use super::generated::CreateSourcePortInput;
use super::generated::Game;
use super::generated::GameEnabledFile;
use super::generated::GameFileEntry;
use super::generated::GameInput;
use super::generated::Mutation;
use super::generated::PlaySession;
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

  pub async fn Game_enabled_files(
    &self,
    _root: &Game,
    _ctx: &Context<'_>,
  ) -> GraphQLResult<Option<Vec<GameEnabledFile>>> {
    let meta = database::load_game_meta(&_root.id);
    let enabled_files = meta.enabled_files;

    let v: Option<Vec<GameEnabledFile>> = Some(
      enabled_files
        .into_iter()
        .flatten()
        .map(|x| GameEnabledFile {
          relative: x.relative,
          is_enabled: x.is_enabled,
        })
        .collect(),
    );

    Ok(v)
  }

  pub async fn Query_getGame(
    &self,
    _root: &Query,
    _ctx: &Context<'_>,
    id: String,
  ) -> GraphQLResult<Game> {
    Ok(database::load_game_with_meta(&id))
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
    Ok(database::find_all_games())
  }

  pub async fn Query_getSourcePorts(
    &self,
    _root: &Query,
    _ctx: &Context<'_>,
  ) -> GraphQLResult<Vec<SourcePort>> {
    Ok(database::find_all_source_ports())
  }

  pub async fn Mutation_startGame(
    &self,
    _root: &Mutation,
    _ctx: &Context<'_>,
    files: Option<Vec<String>>,
    game_id: String,
    iwad: Option<String>,
    source_port: String,
  ) -> GraphQLResult<bool> {
    let source_port = if cfg!(target_os = "macos") {
      let plist_path = Path::new(&source_port).join("Contents").join("Info.plist");

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
        source_port
      }
    } else {
      source_port
    };

    let mut command = Command::new(source_port);
    let mut play_session = DbPlaySessionEntry {
      started_at: Some(Utc::now().to_rfc3339()),
      ended_at: None,
    };

    if let Some(valid_iwad) = iwad {
      command.args(["-iwad", &valid_iwad]);
    }

    if let Some(valid_files) = files {
      for valid_file in valid_files {
        command.args(["-file", &valid_file]);
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
    todo!()
  }

  pub async fn Mutation_updateNotes(
    &self,
    _root: &Mutation,
    _ctx: &Context<'_>,
    game_id: String,
    notes: String,
  ) -> GraphQLResult<Game> {
    if let Some(mut game) = database::find_game_by_id(&game_id) {
      game.notes = notes;

      database::save_game(game.clone());

      return Ok(game);
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
    if let Some(mut game) = database::find_game_by_id(&game_id) {
      game.rating = rating;

      database::save_game(game.clone());

      return Ok(game);
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
    if let Some(mut game) = database::find_game_by_id(&game_id) {
      game.tags = tags;

      database::save_game(game.clone());

      return Ok(game);
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
    if let Some(mut game_record) = database::find_game_by_id(&game.id) {
      if let Some(rating) = game.rating {
        game_record.rating = rating;
      }

      if let Some(description) = game.description {
        game_record.description = description;
      }

      if let Some(notes) = game.notes {
        game_record.notes = notes;
      }

      if let Some(tags) = game.tags {
        game_record.tags = tags;
      }

      game_record.source_port = game.source_port;
      game_record.iwad_id = game.iwad_id;
      game_record.extra_mod_ids = game.extra_mod_ids;

      database::save_game(game_record.clone());

      return Ok(game_record);
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
    let source_port_record = SourcePort {
      id: source_port.id,
      command: source_port.command,
      is_default: false,
    };

    database::save_source_port(source_port_record.clone());

    Ok(source_port_record)
  }

  pub async fn Mutation_updateSourcePort(
    &self,
    _root: &Mutation,
    _ctx: &Context<'_>,
    source_port: UpdateSourcePortInput,
  ) -> GraphQLResult<SourcePort> {
    let mut source_port_record = database::find_source_port_by_id(source_port.id);

    source_port_record.command = source_port.command;

    database::save_source_port(source_port_record.clone());

    Ok(source_port_record)
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
}
