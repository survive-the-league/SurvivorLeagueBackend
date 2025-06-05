export interface CreateLeagueDto {
    name: string;
    description?: string;
    maxParticipants: number;
    startDate: Date;
    endDate: Date;
    isPrivate: boolean;
    password?: string;
    createdBy: string;
    initialLives: number;
    totalRounds: number;
    leagueType: string; 
    advancedSettings: {
        numberOfLives: number;
        playerForgetToPick: PlayerForgetToPick
    };
    allowReEntry: boolean;
    tiesCountAs: TiesCountAs;
}

enum PlayerForgetToPick {
    NONE = "none",
    LOSE_LIFE = "lose_life",
    RANDOM_PICK = "random_pick",
}; 
enum TiesCountAs {
    WIN = "win",
    LOSE = "lose",
    DRAW = "draw",
};