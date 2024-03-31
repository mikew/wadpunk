use std::fs;
use std::vec;

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

pub fn get_details_directory() -> std::path::PathBuf {
  get_data_directory().join("Details")
}

pub fn init_games() {
  fs::create_dir_all(get_games_directory()).unwrap();
  fs::create_dir_all(get_source_ports_directory()).unwrap();
  fs::create_dir_all(get_details_directory()).unwrap();
}

pub fn find_all_games() -> Vec<Game> {
  let mut games: Vec<Game> = vec![];
  let paths = read_dir(get_games_directory(), false).unwrap();

  for game_disk_entry in paths {
    let name_string = game_disk_entry.name.unwrap();
    let name = name_string.as_str();

    if name.starts_with(".") {
      continue;
    }

    let game_id = if game_disk_entry.children.is_some() {
      format!("{}/", name)
    } else {
      name.to_string()
    };

    games.push(load_game_with_details(&game_id))
  }

  games
}

pub fn normalize_name_from_id(id: &str) -> &str {
  if let Some(is_dir) = id.strip_suffix("/") {
    is_dir
  } else {
    &id
  }
}

pub fn load_game_with_details(id: &str) -> Game {
  let name_normalized = normalize_name_from_id(id);
  let game_details = load_game_details(id);

  return Game {
    id: id.to_string(),
    name: name_normalized.to_string(),

    rating: game_details.rating.unwrap_or_default(),
    description: game_details.description.unwrap_or_default(),
    notes: game_details.notes.unwrap_or_default(),
    tags: game_details.tags.unwrap_or_default(),

    source_port: game_details.source_port,
    iwad_id: game_details.iwad_id,
    extra_mod_ids: game_details.extra_mod_ids,
  };
}

pub fn load_game_details(game_id: &str) -> DbGameDetails {
  let json_details_path = get_details_directory().join(game_id).join("details.json");

  let json_contents = fs::read_to_string(json_details_path).unwrap_or("{}".to_string());

  serde_json::from_str::<DbGameDetails>(&json_contents).unwrap()
}

pub fn load_game_play_sessions(game_id: &str) -> DbPlaySession {
  let details_path = get_details_directory()
    .join(game_id)
    .join("playSessions.json");
  let json_contents = fs::read_to_string(details_path).unwrap_or("{}".to_string());

  serde_json::from_str::<DbPlaySession>(&json_contents).unwrap()
}

pub fn record_game_play_session(game_id: &str, play_session: DbPlaySessionEntry) {
  let file_path = get_details_directory()
    .join(game_id)
    .join("playSessions.json");

  let mut play_sessions = load_game_play_sessions(game_id);
  let mut play_sessions_sessions = play_sessions.sessions.clone().unwrap_or_default();
  play_sessions_sessions.push(play_session.clone());
  play_sessions.sessions = Some(play_sessions_sessions);

  let json_str = serde_json::to_string(&play_sessions).unwrap();

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

pub fn find_game_by_id(id: &str) -> Option<Game> {
  let game = load_game_with_details(id);
  return Some(game);
}

pub fn save_game(game: Game) {
  let json_details_path = get_details_directory()
    .join(&game.name)
    .join("details.json");

  let game_details_json = DbGameDetails {
    rating: Some(game.rating),
    description: Some(game.description),
    notes: Some(game.notes),
    tags: Some(game.tags),

    source_port: game.source_port,
    iwad_id: game.iwad_id,
    extra_mod_ids: game.extra_mod_ids,
    enabled_files: Some(vec![]),
  };

  let json_str = serde_json::to_string(&game_details_json).unwrap();

  fs::create_dir_all(json_details_path.parent().unwrap()).unwrap();
  fs::write(json_details_path, json_str).unwrap();
}

pub fn find_all_source_ports() -> Vec<SourcePort> {
  let mut source_ports: Vec<SourcePort> = vec![];
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
    source_ports.push(find_source_port_by_id(source_port_id))
  }

  source_ports
}

pub fn find_source_port_by_id(source_port_id: String) -> SourcePort {
  let json_path = get_source_ports_directory().join(format!("{}.json", source_port_id));
  let json_contents = fs::read_to_string(json_path).unwrap_or("{}".to_string());
  let db_source_port = serde_json::from_str::<DbSourcePort>(&json_contents).unwrap();

  SourcePort {
    id: db_source_port.id.unwrap(),
    command: db_source_port.command.unwrap(),
    is_default: false,
  }
}

pub fn save_source_port(source_port: SourcePort) {
  let json_path = get_source_ports_directory().join(format!("{}.json", source_port.id));
  let db_source_port = DbSourcePort {
    id: Some(source_port.id),
    command: Some(source_port.command),
  };
  let json_str = serde_json::to_string(&db_source_port).unwrap();

  fs::write(json_path, json_str).unwrap();
}

pub fn delete_source_port(id: &str) {
  let json_path = get_source_ports_directory().join(format!("{}.json", id));
  fs::remove_file(json_path).unwrap();
}

#[derive(Serialize, Deserialize, Debug, Default, Clone)]
pub struct DbGameDetails {
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

#[derive(Serialize, Deserialize, Debug, Default, Clone)]
pub struct DbSourcePort {
  pub id: Option<String>,
  pub command: Option<Vec<String>>,
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
