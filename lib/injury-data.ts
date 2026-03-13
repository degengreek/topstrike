/**
 * Injury and Suspension Data
 * Source: SportsGambler.com
 *
 * UPDATE THIS FILE WEEKLY (Monday mornings) with fresh injury data
 * After updating, run: npm run sync-injuries (or daily_update.bat)
 *
 * Last updated: 2026-03-13
 */

export interface InjuryData {
  player: string
  team: string
  position: string
  injury: string
  return_date: string | null
}

export const INJURY_DATA: InjuryData[] = [
  // ===== PREMIER LEAGUE =====
  // Arsenal
  { player: "Reiss Nelson", team: "Arsenal", position: "Forward", injury: "Calf injury", return_date: "2026-03-14" },
  { player: "Leandro Trossard", team: "Arsenal", position: "Midfielder", injury: "Knock", return_date: null },
  { player: "Mikel Merino", team: "Arsenal", position: "Midfielder", injury: "Foot injury", return_date: "2026-06-01" },

  // Aston Villa
  { player: "Kosta Nedeljkovic", team: "Aston Villa", position: "Defender", injury: "Low back strain", return_date: "2026-03-14" },
  { player: "Matty Cash", team: "Aston Villa", position: "Defender", injury: "Calf injury", return_date: null },
  { player: "Youri Tielemans", team: "Aston Villa", position: "Midfielder", injury: "Ankle injury", return_date: "2026-04-18" },
  { player: "Boubacar Kamara", team: "Aston Villa", position: "Midfielder", injury: "Knee injury", return_date: "2026-06-01" },

  // Bournemouth
  { player: "Ben Gannon Doak", team: "Bournemouth", position: "Forward", injury: "Thigh injury", return_date: "2026-04-11" },
  { player: "Lewis Cook", team: "Bournemouth", position: "Midfielder", injury: "Thigh injury", return_date: "2026-04-11" },
  { player: "Justin Kluivert", team: "Bournemouth", position: "Forward", injury: "Knee injury", return_date: "2026-04-11" },

  // Brentford
  { player: "Fabio Carvalho", team: "Brentford", position: "Forward", injury: "Cruciate ligament injury", return_date: "2026-09-12" },

  // Brighton
  { player: "Kaoru Mitoma", team: "Brighton", position: "Midfielder", injury: "Ankle injury", return_date: null },
  { player: "Lewis Dunk", team: "Brighton", position: "Defender", injury: "Knee injury", return_date: "2026-03-14" },
  { player: "Adam Webster", team: "Brighton", position: "Defender", injury: "Knee injury", return_date: "2026-06-01" },

  // Chelsea
  { player: "Estevao", team: "Chelsea", position: "Forward", injury: "Thigh injury", return_date: "2026-03-14" },
  { player: "Levi Colwill", team: "Chelsea", position: "Defender", injury: "Cruciate ligament injury", return_date: "2026-05-24" },
  { player: "Mykhaylo Mudryk", team: "Chelsea", position: "Forward", injury: "Doping suspension", return_date: null },

  // Liverpool
  { player: "Wataru Endo", team: "Liverpool", position: "Midfielder", injury: "Ankle injury", return_date: "2026-06-01" },
  { player: "Alexander Isak", team: "Liverpool", position: "Forward", injury: "Lower leg injury", return_date: "2026-04-11" },
  { player: "Conor Bradley", team: "Liverpool", position: "Defender", injury: "Knee injury", return_date: "2026-11-21" },

  // Manchester City
  { player: "Mateo Kovacic", team: "Manchester City", position: "Midfielder", injury: "Ankle injury / Red card suspension", return_date: "2026-05-02" },
  { player: "Jack Grealish", team: "Manchester City", position: "Midfielder", injury: "Foot injury", return_date: "2026-06-01" },
  { player: "Josko Gvardiol", team: "Manchester City", position: "Defender", injury: "Lower leg injury", return_date: "2026-04-25" },
  { player: "Erling Haaland", team: "Manchester City", position: "Forward", injury: "Knee injury", return_date: null },

  // Manchester United
  { player: "Lisandro Martinez", team: "Manchester United", position: "Defender", injury: "Calf injury", return_date: "2026-03-15" },
  { player: "Mason Mount", team: "Manchester United", position: "Midfielder", injury: "Other injury", return_date: "2026-03-15" },
  { player: "Matthijs de Ligt", team: "Manchester United", position: "Defender", injury: "Low back strain", return_date: "2026-04-11" },

  // Newcastle United
  { player: "Bruno Guimaraes", team: "Newcastle United", position: "Midfielder", injury: "Thigh injury", return_date: "2026-04-11" },
  { player: "Lewis Miley", team: "Newcastle United", position: "Midfielder", injury: "Knee injury", return_date: "2026-03-18" },
  { player: "Sven Botman", team: "Newcastle United", position: "Defender", injury: "Back injury", return_date: null },

  // Nottingham Forest
  { player: "Chris Wood", team: "Nottingham Forest", position: "Forward", injury: "Knee injury", return_date: "2026-04-11" },

  // Tottenham
  { player: "Micky van de Ven", team: "Tottenham Hotspur", position: "Defender", injury: "Red card suspension", return_date: "2026-03-22" },
  { player: "Cristian Romero", team: "Tottenham Hotspur", position: "Defender", injury: "Red card suspension", return_date: "2026-03-15" },
  { player: "Destiny Udogie", team: "Tottenham Hotspur", position: "Defender", injury: "Thigh injury", return_date: "2026-03-15" },
  { player: "Wilson Odobert", team: "Tottenham Hotspur", position: "Forward", injury: "Knee injury", return_date: "2026-11-28" },
  { player: "Rodrigo Bentancur", team: "Tottenham Hotspur", position: "Midfielder", injury: "Thigh injury", return_date: "2026-05-02" },
  { player: "Dejan Kulusevski", team: "Tottenham Hotspur", position: "Midfielder", injury: "Knee injury", return_date: "2026-05-02" },
  { player: "James Maddison", team: "Tottenham Hotspur", position: "Midfielder", injury: "Cruciate ligament injury", return_date: "2026-06-01" },

  // ===== SERIE A =====
  // AC Milan
  { player: "Ruben Loftus-Cheek", team: "AC Milan", position: "Midfielder", injury: "Head injury", return_date: "2026-04-24" },
  { player: "Matteo Gabbia", team: "AC Milan", position: "Defender", injury: "Hamstring", return_date: "2026-04-03" },
  { player: "Santiago Gimenez", team: "AC Milan", position: "Forward", injury: "Red card + Ankle injury", return_date: null },

  // Atalanta
  { player: "Charles De Ketelaere", team: "Atalanta", position: "Midfielder", injury: "Knee injury", return_date: "2026-03-20" },
  { player: "Ederson", team: "Atalanta", position: "Midfielder", injury: "Other injury", return_date: null },

  // Bologna
  { player: "Remo Freuler", team: "Bologna", position: "Midfielder", injury: "Yellow cards suspension", return_date: "2026-03-15" },
  { player: "Emil Holm", team: "Bologna", position: "Defender", injury: "Calf injury", return_date: "2026-03-21" },

  // Inter Milan
  { player: "Hakan Calhanoglu", team: "Inter Milan", position: "Midfielder", injury: "Thigh injury", return_date: null },
  { player: "Alessandro Bastoni", team: "Inter Milan", position: "Defender", injury: "Lower leg injury", return_date: null },
  { player: "Valentin Carboni", team: "Inter Milan", position: "Midfielder", injury: "Cruciate ligament injury", return_date: "2026-10-10" },

  // Juventus
  { player: "Dusan Vlahovic", team: "Juventus", position: "Forward", injury: "Groin injury", return_date: "2026-03-14" },
  { player: "Arkadiusz Milik", team: "Juventus", position: "Forward", injury: "Calf injury", return_date: null },

  // Napoli
  { player: "Stanislav Lobotka", team: "Napoli", position: "Midfielder", injury: "Physical discomfort", return_date: null },
  { player: "Scott McTominay", team: "Napoli", position: "Midfielder", injury: "Thigh injury", return_date: null },
  { player: "Amir Rrahmani", team: "Napoli", position: "Defender", injury: "Thigh injury", return_date: "2026-04-19" },

  // Roma
  { player: "Paulo Dybala", team: "Roma", position: "Forward", injury: "Other injury", return_date: "2026-04-24" },
  { player: "Matias Soule", team: "Roma", position: "Forward", injury: "Groin injury", return_date: null },

  // Torino
  { player: "Perr Schuurs", team: "Torino", position: "Defender", injury: "Knee injury", return_date: null },
  { player: "Pietro Pellegri", team: "Torino", position: "Forward", injury: "Cruciate ligament injury", return_date: null },

  // ===== BUNDESLIGA =====
  // Bayern Munich
  { player: "Manuel Neuer", team: "Bayern Munich", position: "Goalkeeper", injury: "Calf injury", return_date: null },
  { player: "Alphonso Davies", team: "Bayern Munich", position: "Defender", injury: "Other injury", return_date: null },
  { player: "Hiroki Ito", team: "Bayern Munich", position: "Defender", injury: "Thigh injury", return_date: null },

  // Bayer Leverkusen
  { player: "Alejandro Grimaldo", team: "Bayer Leverkusen", position: "Defender", injury: "Yellow cards suspension", return_date: "2026-03-21" },
  { player: "Nathan Tella", team: "Bayer Leverkusen", position: "Midfielder", injury: "Foot injury", return_date: null },
  { player: "Victor Okoh Boniface", team: "Bayer Leverkusen", position: "Forward", injury: "Knee injury", return_date: null },

  // Eintracht Frankfurt
  { player: "Ansgar Knauff", team: "Eintracht Frankfurt", position: "Forward", injury: "Abdomen injury", return_date: null },
  { player: "Arthur Theate", team: "Eintracht Frankfurt", position: "Defender", injury: "Other injury", return_date: null },

  // Freiburg
  { player: "Max Rosenfelder", team: "Freiburg", position: "Defender", injury: "Hamstring injury", return_date: null },
  { player: "Daniel-Kofi Kyereh", team: "Freiburg", position: "Midfielder", injury: "Cruciate ligament injury", return_date: null },

  // RB Leipzig
  { player: "Xaver Schlager", team: "RB Leipzig", position: "Midfielder", injury: "Groin injury", return_date: null },
  { player: "Peter Gulacsi", team: "RB Leipzig", position: "Goalkeeper", injury: "Other injury", return_date: null },

  // Stuttgart
  { player: "Yannik Keitel", team: "Stuttgart", position: "Midfielder", injury: "Knee injury", return_date: null },
  { player: "Josha Vagnoman", team: "Stuttgart", position: "Defender", injury: "Thigh injury", return_date: null },
]

export const LAST_UPDATED = "2026-03-13"

export const DATA_SOURCES = {
  premier_league: "https://www.sportsgambler.com/injuries/football/",
  serie_a: "https://www.sportsgambler.com/injuries/football/italy-serie-a/",
  bundesliga: "https://www.sportsgambler.com/injuries/football/germany-bundesliga/"
}
