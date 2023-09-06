pub struct DataSource;
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
    todo!()
  }

  pub async fn Query_getGames(&self, root: &Query, ctx: &Context<'_>) -> GraphQLResult<Vec<Game>> {
    todo!()
  }
}
