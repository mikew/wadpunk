use std::collections::HashMap;
use std::fs::create_dir_all;
use std::vec;
use std::{fs, sync::Mutex};

use serde::{Deserialize, Serialize};
use tauri::api::{
  dir::read_dir,
  path::{document_dir, home_dir},
};

use crate::graphql::generated::Game;

pub struct DirectoryManager;

impl DirectoryManager {
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

  pub fn init_games() {
    create_dir_all(DirectoryManager::get_games_directory()).unwrap();
    create_dir_all(DirectoryManager::get_source_ports_directory()).unwrap();
    create_dir_all(DirectoryManager::get_meta_directory()).unwrap();
  }
}

#[derive(Debug, Default)]
pub struct DataBase {
  pub games_cache: Mutex<HashMap<String, Game>>,
}

impl DataBase {
  pub fn find_all_games() -> Vec<Game> {
    let mut games: Vec<Game> = vec![];
    let paths = read_dir(DirectoryManager::get_games_directory(), false).unwrap();

    for game_disk_entry in paths {
      if game_disk_entry.children.is_some() {
        let name = game_disk_entry.name.unwrap();

        let json_meta_path = DirectoryManager::get_meta_directory()
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

    games
  }

  pub fn initialize_games_cache(&self) {
    for game in Self::find_all_games() {
      self
        .games_cache
        .lock()
        .unwrap()
        .insert(game.name.clone(), game);
    }
  }

  pub fn find_game_by_id(&self, id: String) -> Option<Game> {
    self.games_cache.lock().unwrap().get(&id).cloned()
  }
}

#[derive(Serialize, Deserialize, Debug)]
pub struct GameMetaJson {
  pub rating: Option<i32>,
  pub notes: Option<String>,
  pub tags: Option<Vec<String>>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct PlaySessionJson {
  pub sessions: Option<PlaySessionEntry>,
}

#[derive(Serialize, Deserialize, Debug, Default)]
pub struct PlaySessionEntry {
  pub started_at: Option<String>,
  pub ended_at: Option<String>,
}
