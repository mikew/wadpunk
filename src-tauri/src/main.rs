#![allow(non_snake_case)]
// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use database::DirectoryManager;
use graphql::datasource::DataSource;

mod database;
mod graphql;
mod tauri_commands;

fn main() {
  DirectoryManager::init_games();

  let schema = async_graphql::Schema::build(
    graphql::generated::Query,
    graphql::generated::Mutation,
    async_graphql::EmptySubscription,
  )
  .data(DataSource)
  .finish();

  tauri::Builder::default()
    .plugin(tauri_plugin_graphql::init(schema))
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
