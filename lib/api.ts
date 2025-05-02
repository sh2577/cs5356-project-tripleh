// API helper functions for client-side use

// Type definitions
export interface Snack {
    id: string;
    userId: string;
    name: string;
    description: string;
    location: string;
    imageUrl: string;
    createdAt: string;
    updatedAt: string;
}

export interface Swipe {
    id: string;
    swiperUserId: string;
    swipedSnackId: string;
    liked: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface Match {
    id: string;
    createdAt: string;
    otherUser: {
        id: string;
        name: string;
        image: string | null;
    };
    userSnack: {
        id: string;
        name: string;
        imageUrl: string;
    };
    otherUserSnack: {
        id: string;
        name: string;
        imageUrl: string;
    };
}

// API functions

// Get user's snacks
export async function getUserSnacks(): Promise<Snack[]> {
    const response = await fetch('/api/snacks');

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch snacks');
    }

    return response.json();
}

// Create a new snack
export async function createSnack(snack: {
    name: string;
    description: string;
    location: string;
    imageUrl: string;
}): Promise<Snack> {
    const response = await fetch('/api/snacks', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(snack),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create snack');
    }

    return response.json();
}

// Get snack feed for swiping
export async function getSnackFeed(): Promise<Snack[]> {
    const response = await fetch('/api/snacks/feed');

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch snack feed');
    }

    return response.json();
}

// Submit a swipe (like/dislike)
export async function submitSwipe(
    swipedSnackId: string,
    liked: boolean
): Promise<{
    swipe: Swipe;
    match: Match | null;
}> {
    const response = await fetch('/api/swipes', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ swipedSnackId, liked }),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to submit swipe');
    }

    return response.json();
}

// Get user's matches
export async function getUserMatches(): Promise<Match[]> {
    const response = await fetch('/api/matches');

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch matches');
    }

    return response.json();
}
