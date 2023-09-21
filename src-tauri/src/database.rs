use std::fs;
use std::vec;

use serde::{Deserialize, Serialize};
use tauri::api::dir::DiskEntry;
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
    fs::create_dir_all(DirectoryManager::get_games_directory()).unwrap();
    fs::create_dir_all(DirectoryManager::get_source_ports_directory()).unwrap();
    fs::create_dir_all(DirectoryManager::get_meta_directory()).unwrap();
  }
}

#[derive(Debug, Default)]
pub struct DataBase;

impl DataBase {
  pub fn find_all_games() -> Vec<Game> {
    let mut games: Vec<Game> = vec![];
    let paths = read_dir(DirectoryManager::get_games_directory(), false).unwrap();

    for game_disk_entry in paths {
      let name = game_disk_entry.name.unwrap();

      if name.clone().starts_with(".") {
        continue;
      }

      let game_id = if game_disk_entry.children.is_some() {
        format!("{}/", name)
      } else {
        name.clone()
      };

      games.push(Self::load_game_with_meta(game_id))
    }

    games
  }

  pub fn normalize_name_from_id(id: String) -> String {
    if let Some(is_dir) = id.strip_suffix("/") {
      is_dir.to_string()
    } else {
      id.clone()
    }
  }

  pub fn load_game_with_meta(id: String) -> Game {
    let name_normalized = Self::normalize_name_from_id(id.clone());
    let game_meta = Self::load_game_meta(id.clone());

    return Game {
      id: id.clone(),
      name: name_normalized,

      rating: game_meta.rating.unwrap_or_default(),
      description: game_meta.description.unwrap_or_default(),
      notes: game_meta.notes.unwrap_or_default(),
      tags: game_meta.tags.unwrap_or_default(),

      source_port: game_meta.source_port,
      iwad_id: game_meta.iwad_id,
      extra_mod_ids: game_meta.extra_mod_ids,
    };
  }

  pub fn load_game_meta(game_id: String) -> DbGameMeta {
    let json_meta_path = DirectoryManager::get_meta_directory()
      .join(game_id)
      .join("meta.json");

    let json_contents = fs::read_to_string(json_meta_path).unwrap_or("{}".to_string());

    serde_json::from_str::<DbGameMeta>(&json_contents).unwrap()
  }

  pub fn load_game_play_sessions(game_id: String) -> DbPlaySession {
    let meta_path = DirectoryManager::get_meta_directory()
      .join(game_id)
      .join("playSessions.json");
    let json_contents = fs::read_to_string(meta_path).unwrap_or("{}".to_string());

    serde_json::from_str::<DbPlaySession>(&json_contents).unwrap()
  }

  pub fn record_game_play_session(game_id: String, play_session: DbPlaySessionEntry) {
    let file_path = DirectoryManager::get_meta_directory()
      .join(game_id.clone())
      .join("playSessions.json");

    let mut play_sessions = Self::load_game_play_sessions(game_id);
    let mut play_sessions_sessions = play_sessions.sessions.clone().unwrap_or_default();
    play_sessions_sessions.push(play_session.clone());
    play_sessions.sessions = Some(play_sessions_sessions);

    let json_str = serde_json::to_string(&play_sessions).unwrap();

    fs::create_dir_all(file_path.parent().unwrap()).unwrap();
    fs::write(file_path, json_str).unwrap();
  }

  pub fn find_all_game_files(game_id: String) -> Vec<String> {
    let mut files: Vec<String> = vec![];

    if game_id.ends_with("/") {
      let files_in_game_folder =
        read_dir(DirectoryManager::get_games_directory().join(game_id), true).unwrap();

      for file_disk_entry in files_in_game_folder {
        recurse_disk_entry(file_disk_entry, &mut files);
      }
    } else {
      files.push(
        DirectoryManager::get_games_directory()
          .join(game_id)
          .to_str()
          .unwrap()
          .to_string(),
      );
    }

    files
  }

  pub fn initialize_games_cache(&self) {}

  pub fn find_game_by_id(&self, id: String) -> Option<Game> {
    let game = Self::load_game_with_meta(id.clone());
    return Some(game);
  }

  pub fn save_game(game: Game) {
    let json_meta_path = DirectoryManager::get_meta_directory()
      .join(game.name)
      .join("meta.json");

    let game_meta_json = DbGameMeta {
      rating: Some(game.rating),
      description: Some(game.description),
      notes: Some(game.notes),
      tags: Some(game.tags),

      source_port: game.source_port,
      iwad_id: game.iwad_id,
      extra_mod_ids: game.extra_mod_ids,
      enabled_files: Some(vec![]),
    };

    let json_str = serde_json::to_string(&game_meta_json).unwrap();

    fs::create_dir_all(json_meta_path.parent().unwrap()).unwrap();
    fs::write(json_meta_path, json_str).unwrap();
  }
}

#[derive(Serialize, Deserialize, Debug, Default, Clone)]
pub struct DbGameMeta {
  pub rating: Option<i32>,
  pub description: Option<String>,
  pub notes: Option<String>,
  pub tags: Option<Vec<String>>,

  pub iwad_id: Option<String>,
  pub source_port: Option<String>,
  pub extra_mod_ids: Option<Vec<String>>,
  pub enabled_files: Option<Vec<DbGameEnabledFile>>,
}

#[derive(Serialize, Deserialize, Debug, Default, Clone)]
pub struct DbGameEnabledFile {
  pub is_enabled: bool,
  pub relative: String,
}

#[derive(Serialize, Deserialize, Debug, Default, Clone)]
pub struct DbPlaySession {
  pub sessions: Option<Vec<DbPlaySessionEntry>>,
}

#[derive(Serialize, Deserialize, Debug, Default, Clone)]
pub struct DbPlaySessionEntry {
  pub started_at: Option<String>,
  pub ended_at: Option<String>,
}

fn recurse_disk_entry(dir: DiskEntry, files: &mut Vec<String>) {
  if let Some(children) = dir.children {
    for d in children {
      recurse_disk_entry(d, files);
    }
  } else {
    files.push(dir.path.to_str().unwrap().to_string());
  }
}
