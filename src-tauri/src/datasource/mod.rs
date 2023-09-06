pub struct DataSource;
use std::vec;

use async_graphql::Context;
use async_graphql::Result as GraphQLResult;

use crate::graphql::generated::Game;
use crate::graphql::generated::PlaySession;
use crate::graphql::generated::Query;

impl DataSource {
  pub async fn Game_play_sessions(
    &self,
    root: &Game,
    ctx: &Context<'_>,
  ) -> GraphQLResult<Vec<PlaySession>> {
    Ok(vec![PlaySession {
      started_at: "".to_string(),
      ended_at: "".to_string(),
      duration: 1234,
    }])
  }

  pub async fn Query_getGames(&self, root: &Query, ctx: &Context<'_>) -> GraphQLResult<Vec<Game>> {
    Ok(vec![Game {
      id: "1234".to_string(),
      name: "1234".to_string(),
      description: "1234".to_string(),
      notes: "1234".to_string(),
      rating: 3,
      tags: vec![],
    }])
  }
}
