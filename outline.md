# Ground Information

Users can create multiple strategies for each game, but only admit one strategy per game. All strategies for each game will be run in separate tournaments each day.

Tournaments are run for each game every day. Each day has a tournament for each game. Each game has tournaments for each day.

## Requirements

Each primary resource page should focus on data specifically relevant to that resource. For example, user-specific details belong on the user page, and game-specific details on the game page, avoiding unnecessary duplication. This ensures clarity and reduces clutter across the application.

When deciding where to place a stat shared by two resources (e.g., 'games joined' might be on both user and game pages), consider:

- Which resource is the natural owner of the data?
- Do we risk duplicating or fragmenting data by adding it to multiple resources?
- How does the stat’s perspective differ under user vs. game contexts?

For instance:

- 'Games joined' might be listed on a user page to show total participation.
- 'Users in a game' might appear on a game page to highlight current engagement.

Even though both represent the same underlying data, each resource offers a distinct perspective. Placing each stat in its most natural context avoids confusion and keeps the application’s data organized.

## Games

- All games can be browsed:
  - you're active in
  - most recent
  - most popular
  - most overall tokens per strategy (average of all strategies or top strategies)

### Each Game

- **Relationships:**
  - game > tournaments
  - game > users
  - game > strategies
  - game > posts

- **Leaderboards:**
  - most wins
  - fewest tokens
  - most recent
  - highest engagement (most active users)
  - Top 10 over time

- **Tournaments:**
  - most recent
  - participation over time

- **Graphs:**
  - Tokens per standing over time:
    - A line for every standing
    - x-axis is time, y-axis is tokens
    - Lines will start at the time the standing appeared
    - User standings will be highlighted and connected with a line, which will end up crossing the other lines
  - Amount of standings over time:
    - A line for every standing
    - x-axis is time, y-axis is amount of standings
    - Lines will start at the time the standing appeared
    - User standings will be highlighted and connected with a line, which will end up crossing the other lines
  - Raw score per standing over time:
    - A line for every standing
    - x-axis is time, y-axis is raw score
    - Lines will start at the time the standing appeared
    - User standings will be highlighted and connected with a line, which will end up crossing the other lines

## Tournaments

- All tournaments can be browsed:
  - you're active in
  - One per game
  - Filtered by game
  - highest participation

### Each Tournament

- **Relationships:**
  - tournament > strategies/users
  - tournament > game

- **Leaderboards:**
  - most wins
  - fewest tokens
  - most recent

- **Game:**
  - Has the game it is for

## Users

- All users can be browsed:
  - most recent
  - most popular
  - most wins
  - highest engagement (most active)

### Each User

- **Relationships:**
  - user > strategies
  - user > games
  - user > posts

- **Games:**
  - List of games they are in
  - List of each game they have won:
    - highest ranking
    - most recent ranking
    - amount of strategies they have created for that game
    - amount of tournaments they have been in for that game

- **Strategies:**
  - List of strategies they have created (not all will be active and in tournaments):
    - most recent
    - most tokens
    - not highest ranking, as this list will be the same as the users list of games, and will have some strategies that are not in tournaments

- **Posts:**
  - List of posts they have made

## Strategies

- All strategies can be browsed:
  - you've created
  - most recent
  - highest ranking (More submissions per tournament will weight this higher)

### Each Strategy

- **Relationships:**
  - strategy > user
  - strategy > game
  - strategy > tournaments

- **Details:**
  - Has a user
  - Has a game
  - List of tournaments it has been in:
    - most recent
    - strategy ranking
    - highest participation
    - participation to standing ratio

## Posts

- All posts can be browsed:
  - most recent
  - most popular

### Each Post

- **Relationships:**
  - post > user
  - post > game

- **Details:**
  - Has a user
  - Has a game
  - List of comments:
    - most recent
    - most popular

## Throne

- **Purpose:** To identify and showcase top performers, track performance trends, and provide insights into what drives success.

- **Key Metrics:**
  - **Dominance Score:** A composite score based on win rate, activity frequency, and peak performance. This provides an overall measure of a user's or strategy's strength.
  - **Momentum:** Combines "Longest Undefeated Streak" and "Recent Hot Streak" to highlight current performance trajectory.
  - **Consistency:** Win Rate - Highlights reliability beyond raw wins.
  - **Activity:** Activity Frequency - Monitors engagement levels.
  - **Peak:** Peak Performance - Shows top rank or best results.

- **Visualizations:**
  - Leaderboards: Display top performers based on Dominance Score and other key metrics.
  - Historical Ranking Trend: Line graphs showing performance changes over time.
  - Head-to-Head Comparisons: Visual comparison of key metrics between users or strategies.

- **Examples:**
  - "User A has a high Dominance Score due to their consistent win rate and frequent activity."
  - "Strategy B is showing strong Momentum, indicating it's a rising star."

## Head-to-Head Matchups

- Compare users, strategies, or games directly.

## Missing

Some graph where lines will emerge from the x-axis at the time some datapoint in the primary metric starts, pushing the other lines up. Each space between the lines will have varying width, depending on some secondary metric of the datapoints surrounding it. The lines will be connected to the datapoints they represent, and the user's datapoints will be highlighted with a line connecting them. The two metrics which have this relationship (Lines start and no two lines will have the same xy datapoint) could be
