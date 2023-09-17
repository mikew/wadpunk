use std::fs;
use std::process::Command;
use std::vec;

use async_graphql::Context;
use async_graphql::Error;
use async_graphql::Result as GraphQLResult;
use tauri::api::shell::open;
use tauri::AppHandle;
use tauri::Manager;

use crate::database::DataBase;
use crate::database::DirectoryManager;
use crate::database::PlaySessionJson;

use super::generated::AppSettings;
use super::generated::Game;
use super::generated::Mutation;
use super::generated::PlaySession;
use super::generated::Query;

pub struct DataSource;

impl DataSource {
  pub async fn Game_play_sessions(
    &self,
    root: &Game,
    _ctx: &Context<'_>,
  ) -> GraphQLResult<Vec<PlaySession>> {
    let play_sessions: Vec<PlaySession> = vec![];

    let meta_path = DirectoryManager::get_meta_directory()
      .join(&root.name)
      .join("playSessions.json");
    let json_contents = fs::read_to_string(meta_path).unwrap_or("{}".to_string());
    let play_session_meta = serde_json::from_str::<PlaySessionJson>(&json_contents).unwrap();

    if let Some(play_sessions) = play_session_meta.sessions {
      // TODO Implement ...
      println!("{:?} {:?}", root.name, play_sessions);
    }

    Ok(play_sessions)
  }

  pub async fn Query_getAppSettings(
    &self,
    _root: &Query,
    _ctx: &Context<'_>,
  ) -> GraphQLResult<AppSettings> {
    Ok(AppSettings {
      dataDirectory: String::from(DirectoryManager::get_data_directory().to_str().unwrap()),
    })
  }

  pub async fn Query_getGameFiles(
    &self,
    _root: &Query,
    _ctx: &Context<'_>,
    game_ids: Vec<String>,
  ) -> GraphQLResult<Vec<String>> {
    let mut files: Vec<String> = vec![];

    for game_id in game_ids {
      let mut game_files = DataBase::find_all_game_files(game_id);
      files.append(&mut game_files)
    }

    Ok(files)
  }

  pub async fn Query_getGames(&self, _root: &Query, ctx: &Context<'_>) -> GraphQLResult<Vec<Game>> {
    let db = ctx.data::<AppHandle>().unwrap().state::<DataBase>();
    let game_cache = db.games_cache.lock().unwrap();

    Ok(game_cache.values().cloned().collect())
  }

  pub async fn Mutation_startGame(
    &self,
    _root: &Mutation,
    _ctx: &Context<'_>,
    files: Option<Vec<String>>,
    iwad: Option<String>,
    source_port: String,
  ) -> GraphQLResult<bool> {
    let mut command = Command::new(source_port);

    if let Some(valid_iwad) = iwad {
      command.args(["-iwad", &valid_iwad]);
    }

    if let Some(valid_files) = files {
      for valid_file in valid_files {
        command.args(["-file", &valid_file]);
      }
    }

    let exit_status = command.status().unwrap();

    Ok(exit_status.success())
  }

  pub async fn Mutation_openGamesFolder(
    &self,
    _root: &Mutation,
    ctx: &Context<'_>,
    game_id: Option<String>,
  ) -> GraphQLResult<bool> {
    let app = ctx.data::<AppHandle>().unwrap();

    let mut path_to_open = DirectoryManager::get_games_directory();

    if let Some(game_id) = game_id {
      path_to_open.push(game_id);
    }

    open(&app.shell_scope(), path_to_open.to_str().unwrap(), None).unwrap();

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
    ctx: &Context<'_>,
    game_id: String,
    notes: String,
  ) -> GraphQLResult<Game> {
    let db = ctx.data::<AppHandle>().unwrap().state::<DataBase>();

    if let Some(mut game) = db.find_game_by_id(game_id.clone(), true) {
      game.notes = notes;

      DataBase::save_game(game.clone());

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
    ctx: &Context<'_>,
    game_id: String,
    rating: i32,
  ) -> GraphQLResult<Game> {
    let db = ctx.data::<AppHandle>().unwrap().state::<DataBase>();

    if let Some(mut game) = db.find_game_by_id(game_id.clone(), true) {
      game.rating = rating;

      DataBase::save_game(game.clone());

      return Ok(game);
    }

    Err(Error {
      message: format!("game {} not found", game_id),
      source: None,
      extensions: None,
    })
  }
  pub async fn Mutation_initializeApp(
    &self,
    _root: &Mutation,
    ctx: &Context<'_>,
  ) -> GraphQLResult<bool> {
    DirectoryManager::init_games();
    let db = ctx.data::<AppHandle>().unwrap().state::<DataBase>();
    db.initialize_games_cache();

    Ok(true)
  }
}
