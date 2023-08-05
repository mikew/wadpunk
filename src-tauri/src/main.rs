// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use async_graphql::EmptyMutation;
use async_graphql::EmptySubscription;
use async_graphql::Object;
use async_graphql::Result as GraphQLResult;
use async_graphql::Schema;
use async_graphql::SimpleObject;

mod tauri_commands;

#[derive(SimpleObject, Debug, Clone)]
struct ListItem {
  id: i32,
  text: String,
}

impl ListItem {
  pub fn new(text: String) -> Self {
    Self { id: 123, text }
  }
}

struct Query;

#[Object]
impl Query {
  async fn list(&self) -> GraphQLResult<Vec<ListItem>> {
    let item = vec![
      ListItem::new("foo".to_string()),
      ListItem::new("bar".to_string()),
    ];

    Ok(item)
  }
}

fn main() {
  let schema = Schema::new(Query, EmptyMutation, EmptySubscription);

  tauri::Builder::default()
    .invoke_handler(tauri::generate_handler![tauri_commands::playground::greet])
    .plugin(tauri_plugin_graphql::init(schema))
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
