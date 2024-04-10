#![allow(non_snake_case)]
// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use graphql::datasource::DataSource;

mod database;
mod graphql;
mod importer;
mod tauri_commands;
mod tauri_helpers;

fn main() {
  let schema = async_graphql::Schema::build(
    graphql::generated::Query,
    graphql::generated::Mutation,
    async_graphql::EmptySubscription,
  )
  .data(DataSource)
  .finish();

  tauri::Builder::default()
    .plugin(tauri_plugin_graphql::init(schema))
    .plugin(tauri_plugin_window_state::Builder::default().build())
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
