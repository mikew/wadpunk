// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use async_graphql::EmptyMutation;
use async_graphql::EmptySubscription;
use async_graphql::Schema;
use datasource::DataSource;

mod datasource;
mod graphql;
mod tauri_commands;

fn main() {
  let schema = Schema::build(graphql::generated::Query, EmptyMutation, EmptySubscription)
    .data(DataSource)
    .finish();

  tauri::Builder::default()
    .invoke_handler(tauri::generate_handler![tauri_commands::playground::greet])
    .plugin(tauri_plugin_graphql::init(schema))
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
