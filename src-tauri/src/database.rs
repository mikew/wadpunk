use std::fs;
use std::vec;

use chrono::TimeZone;
use chrono::Utc;
use serde::{Deserialize, Serialize};
use tauri::api::dir::DiskEntry;
use tauri::api::{
  dir::read_dir,
  path::{document_dir, home_dir},
};

use crate::graphql::generated::Game;
use crate::graphql::generated::SourcePort;

pub fn get_data_directory() -> std::path::PathBuf {
  let fallback_documents_directory = home_dir().unwrap().join("Documents");
  let documents_directory = document_dir().unwrap_or(fallback_documents_directory);

  documents_directory.join("WADPunk")
}

pub fn get_games_directory() -> std::path::PathBuf {
  get_data_directory().join("Games")
}

pub fn get_source_ports_directory() -> std::path::PathBuf {
  get_data_directory().join("SourcePorts")
}

pub fn get_meta_directory() -> std::path::PathBuf {
  get_data_directory().join("Meta")
}

pub fn init_games() {
  fs::create_dir_all(get_games_directory()).unwrap();
  fs::create_dir_all(get_source_ports_directory()).unwrap();
  fs::create_dir_all(get_meta_directory()).unwrap();
}

pub fn find_all_games() -> Vec<DbGameMeta> {
  let mut db_games: Vec<DbGameMeta> = vec![];
  let paths = read_dir(get_games_directory(), false).unwrap();

  for game_disk_entry in paths {
    let file_name = game_disk_entry.name.unwrap();

    if file_name.starts_with(".") {
      continue;
    }

    let game_id = if game_disk_entry.children.is_some() {
      format!("{}/", file_name)
    } else {
      file_name
    };

    db_games.push(load_game_meta(&game_id))
  }

  db_games
}

pub fn normalize_name_from_id(id: &str) -> &str {
  if let Some(is_dir) = id.strip_suffix("/") {
    is_dir
  } else {
    &id
  }
}

pub fn load_game_meta(game_id: &str) -> DbGameMeta {
  let json_meta_path = get_meta_directory().join(game_id).join("meta.json");

  if !json_meta_path.exists() {
    let db_game = DbGameMeta {
      id: Some(game_id.to_string()),
      name: Some(normalize_name_from_id(game_id).to_string()),
      rating: None,
      description: None,
      notes: None,
      tags: None,
      iwad_id: None,
      source_port: None,
      extra_mod_ids: None,
      previous_file_state: None,
      use_custom_config: None,

      installed_at: Some(Utc::now().to_rfc3339()),
    };

    save_game(db_game);
  }

  let json_contents = fs::read_to_string(json_meta_path).unwrap_or("{}".to_string());

  let mut db_game_meta = serde_json::from_str::<DbGameMeta>(&json_contents).unwrap();

  // Intentionally never use the id from the file, use whatever is being passed
  // around.
  db_game_meta.id = Some(game_id.to_string());

  if db_game_meta.name.is_none() {
    db_game_meta.name = Some(normalize_name_from_id(game_id).to_string());
  }

  db_game_meta
}

pub fn load_game_play_sessions(game_id: &str) -> DbPlaySession {
  let meta_path = get_meta_directory().join(game_id).join("playSessions.json");
  let json_contents = fs::read_to_string(meta_path).unwrap_or("{}".to_string());

  serde_json::from_str::<DbPlaySession>(&json_contents).unwrap()
}

pub fn record_game_play_session(game_id: &str, db_play_session_entry: DbPlaySessionEntry) {
  let file_path = get_meta_directory().join(game_id).join("playSessions.json");

  let mut db_play_sessions = load_game_play_sessions(game_id);
  let mut play_sessions_sessions = db_play_sessions.sessions.clone().unwrap_or_default();
  play_sessions_sessions.push(db_play_session_entry.clone());
  db_play_sessions.sessions = Some(play_sessions_sessions);

  let json_str = serde_json::to_string(&db_play_sessions).unwrap();

  fs::create_dir_all(file_path.parent().unwrap()).unwrap();
  fs::write(file_path, json_str).unwrap();
}

pub fn find_all_game_files(game_id: &str) -> Vec<String> {
  let mut files: Vec<String> = vec![];

  if game_id.ends_with("/") {
    let files_in_game_folder = read_dir(get_games_directory().join(game_id), true).unwrap();

    for file_disk_entry in files_in_game_folder {
      recurse_disk_entry(file_disk_entry, &mut files);
    }
  } else {
    files.push(
      get_games_directory()
        .join(game_id)
        .to_str()
        .unwrap()
        .to_string(),
    );
  }

  files
}

pub fn find_game_by_id(id: &str) -> Option<DbGameMeta> {
  let db_game = load_game_meta(id);
  return Some(db_game);
}

pub fn save_game(db_game: DbGameMeta) {
  let json_meta_path = get_meta_directory()
    .join(normalize_name_from_id(&db_game.id.clone().unwrap()))
    .join("meta.json");

  let json_str = serde_json::to_string(&db_game).unwrap();

  fs::create_dir_all(json_meta_path.parent().unwrap()).unwrap();
  fs::write(json_meta_path, json_str).unwrap();
}

pub fn find_all_source_ports() -> Vec<DbSourcePort> {
  let mut db_source_ports: Vec<DbSourcePort> = vec![];
  let paths = read_dir(get_source_ports_directory(), false).unwrap();

  for source_port_disk_entry in paths {
    let name_string = source_port_disk_entry.name.unwrap();
    let name = name_string.as_str();

    if name.starts_with(".") {
      continue;
    }

    if !name.ends_with(".json") {
      continue;
    }

    let source_port_id = name.strip_suffix(".json").unwrap().to_string();
    db_source_ports.push(find_source_port_by_id(source_port_id))
  }

  db_source_ports
}

pub fn find_source_port_by_id(source_port_id: String) -> DbSourcePort {
  let json_path = get_source_ports_directory().join(format!("{}.json", source_port_id));
  let json_contents = fs::read_to_string(json_path).unwrap_or("{}".to_string());

  serde_json::from_str::<DbSourcePort>(&json_contents).unwrap()
}

pub fn save_source_port(db_source_port: DbSourcePort) {
  let json_path =
    get_source_ports_directory().join(format!("{}.json", db_source_port.id.clone().unwrap()));
  let json_str = serde_json::to_string(&db_source_port).unwrap();

  fs::write(json_path, json_str).unwrap();
}

pub fn delete_source_port(id: &str) {
  let json_path = get_source_ports_directory().join(format!("{}.json", id));
  fs::remove_file(json_path).unwrap();
}

#[derive(Serialize, Deserialize, Debug, Default, Clone)]
pub struct DbGameMeta {
  pub id: Option<String>,
  pub name: Option<String>,
  pub rating: Option<i32>,
  pub description: Option<String>,
  pub notes: Option<String>,
  pub tags: Option<Vec<String>>,

  pub iwad_id: Option<String>,
  pub source_port: Option<String>,
  pub extra_mod_ids: Option<Vec<String>>,
  pub previous_file_state: Option<Vec<DbPreviousFileStateItem>>,

  pub use_custom_config: Option<bool>,
  pub installed_at: Option<String>,
}

impl DbGameMeta {
  pub fn to_game(&self) -> Game {
    Game {
      id: self.id.clone().unwrap(),
      name: self.name.clone().unwrap_or_default(),
      rating: self.rating.unwrap_or_default(),
      description: self.description.clone().unwrap_or_default(),
      notes: self.notes.clone().unwrap_or_default(),
      tags: self.tags.clone().unwrap_or_default(),

      iwad_id: Some(self.iwad_id.clone().unwrap_or_default()),
      source_port: Some(self.source_port.clone().unwrap_or_default()),
      extra_mod_ids: Some(self.extra_mod_ids.clone().unwrap_or_default()),
      // previous_file_state: self.previous_file_state.clone().unwrap_or_default(),
      use_custom_config: self.use_custom_config.unwrap_or_default(),
      installed_at: self
        .installed_at
        .clone()
        .unwrap_or(Utc.timestamp_opt(0, 0).unwrap().to_rfc3339()),
    }
  }
}

#[derive(Serialize, Deserialize, Debug, Default, Clone)]
pub struct DbPreviousFileStateItem {
  pub is_enabled: bool,
  pub relative: String,
  pub absolute: String,
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

#[derive(Serialize, Deserialize, Debug, Default, Clone)]
pub struct DbSourcePort {
  pub id: Option<String>,
  pub command: Option<Vec<String>>,
  pub known_source_port_id: Option<String>,
}

fn recurse_disk_entry(dir: DiskEntry, files: &mut Vec<String>) {
  if let Some(children) = dir.children {
    for d in children {
      recurse_disk_entry(d, files);
    }
  } else {
    if dir.name.unwrap().starts_with(".") {
      return;
    }

    files.push(dir.path.to_str().unwrap().to_string());
  }
}

impl DbSourcePort {
  pub fn to_source_port(&self) -> SourcePort {
    SourcePort {
      id: self.id.clone().unwrap(),
      command: self.command.clone().unwrap_or_default(),
      known_source_port_id: self
        .known_source_port_id
        .clone()
        .unwrap_or("gzdoom".to_string()),
      is_default: false,
    }
  }
}
