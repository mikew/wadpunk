pub struct DataSource;
use std::fs;
use std::fs::create_dir_all;
use std::vec;

use async_graphql::Context;
use async_graphql::Result as GraphQLResult;
use serde::Deserialize;
use serde::Serialize;
use tauri::api::dir::read_dir;
use tauri::api::path::document_dir;
use tauri::api::path::home_dir;
use tauri::api::shell::open;
use tauri::AppHandle;
use tauri::Manager;

use crate::graphql::generated::AppSettings;
use crate::graphql::generated::Game;
use crate::graphql::generated::Mutation;
use crate::graphql::generated::PlaySession;
use crate::graphql::generated::Query;

#[derive(Serialize, Deserialize, Debug)]

struct GameMetaJson {
  rating: Option<i32>,
  notes: Option<String>,
  tags: Option<Vec<String>>,
}

#[derive(Serialize, Deserialize, Debug)]
struct PlaySessionJson {
  sessions: Option<PlaySessionEntry>,
}

#[derive(Serialize, Deserialize, Debug, Default)]
struct PlaySessionEntry {
  started_at: Option<String>,
  ended_at: Option<String>,
}

impl DataSource {
  pub fn get_data_directory() -> std::path::PathBuf {
    let fallback_documents_directory = home_dir().unwrap().join("Documents");
    let documents_directory = document_dir().unwrap_or(fallback_documents_directory);

    documents_directory.join("GZDoom Launcher")
  }

  pub fn get_games_directory() -> std::path::PathBuf {
    Self::get_data_directory().join("Games")
  }

  pub fn get_source_ports_directory() -> std::path::PathBuf {
    Self::get_data_directory().join("SourcePorts")
  }

  pub fn get_meta_directory() -> std::path::PathBuf {
    Self::get_data_directory().join("Meta")
  }

  pub async fn Game_play_sessions(
    &self,
    root: &Game,
    _ctx: &Context<'_>,
  ) -> GraphQLResult<Vec<PlaySession>> {
    let play_sessions: Vec<PlaySession> = vec![];

    let meta_path = Self::get_meta_directory()
      .join(&root.name)
      .join("playSessions.json");
    let json_contents = fs::read_to_string(meta_path).unwrap_or("{}".to_string());
    let play_session_meta: PlaySessionJson =
      serde_json::from_str::<PlaySessionJson>(&json_contents).unwrap();

    if play_session_meta.sessions.is_some() {
      let sessions = play_session_meta.sessions.unwrap();
      // TODO Implement ...
      println!("{:?} {:?}", root.name, sessions);
    }

    Ok(play_sessions)
  }

  pub async fn Query_getAppSettings(
    &self,
    _root: &Query,
    _ctx: &Context<'_>,
  ) -> GraphQLResult<AppSettings> {
    Ok(AppSettings {
      dataDirectory: String::from(Self::get_data_directory().to_str().unwrap()),
    })
  }

  pub async fn Query_getGames(
    &self,
    _root: &Query,
    _ctx: &Context<'_>,
  ) -> GraphQLResult<Vec<Game>> {
    let mut games: Vec<Game> = vec![];
    let paths = read_dir(Self::get_games_directory(), false).unwrap();

    for game_disk_entry in paths {
      if game_disk_entry.children.is_some() {
        let name = game_disk_entry.name.unwrap();

        let json_meta_path = Self::get_meta_directory()
          .join(name.clone())
          .join("meta.json");

        let json_contents = fs::read_to_string(json_meta_path).unwrap_or("{}".to_string());
        let game_meta: GameMetaJson = serde_json::from_str::<GameMetaJson>(&json_contents).unwrap();

        games.push(Game {
          id: name.clone(),
          description: "".to_string(),
          name: name.clone(),
          notes: game_meta.notes.unwrap_or_default(),
          rating: game_meta.rating.unwrap_or_default(),
          tags: game_meta.tags.unwrap_or_default(),
        })
      }
    }

    Ok(games)
  }

  pub async fn Mutation_startGame(
    &self,
    _root: &Mutation,
    _ctx: &Context<'_>,
    _files: Option<Vec<String>>,
    _iwad: Option<String>,
  ) -> GraphQLResult<bool> {
    todo!()
  }

  pub async fn Mutation_openGamesFolder(
    &self,
    _root: &Mutation,
    ctx: &Context<'_>,
    game_id: Option<String>,
  ) -> GraphQLResult<bool> {
    let app = ctx.data::<AppHandle>().unwrap();

    let mut path_to_open = Self::get_games_directory();

    if game_id.is_some() {
      path_to_open.push(game_id.unwrap());
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

  pub fn init_games() {
    create_dir_all(Self::get_games_directory()).unwrap();
    create_dir_all(Self::get_source_ports_directory()).unwrap();
    create_dir_all(Self::get_meta_directory()).unwrap();
  }
}
