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

export interface Message {
    id: string;
    matchId: string;
    senderId: string;
    content: string;
    createdAt: string;
    read: boolean;
    isMine?: boolean; // Added for UI purposes
}

export interface SwipeHistoryItem {
    swipe: Swipe;
    snack: {
        id: string;
        name: string;
        description: string;
        location: string;
        imageUrl: string;
        userId: string;
    };
    owner: {
        id: string;
        name: string;
        image: string | null;
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
        throw new Error(error.error || 'Failed to submit heart');
    }

    return response.json();
}

// Get user's matches
export async function getUserMatches(): Promise<Match[]> {
    try {
        console.log('Calling /api/matches');
        const response = await fetch('/api/matches');
        console.log('API response status:', response.status);

        if (!response.ok) {
            const errorData = await response.json();
            console.error('API error response:', errorData);
            throw new Error(errorData.error || 'Failed to fetch matches');
        }

        const data = await response.json();
        console.log('Matches data received:', data.length);
        return data;
    } catch (error) {
        console.error('Error in getUserMatches:', error);
        throw error;
    }
}

// Get messages for a specific match
export async function getMessages(matchId: string, queryParams?: string): Promise<Message[]> {
    const url = queryParams ? `/api/matches/${matchId}/messages?${queryParams}` : `/api/matches/${matchId}/messages`;

    const response = await fetch(url);

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch messages');
    }

    return response.json();
}

// Send a new message
export async function sendMessage(matchId: string, content: string): Promise<Message> {
    const response = await fetch(`/api/matches/${matchId}/messages`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content }),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to send message');
    }

    return response.json();
}

// Get a specific snack
export async function getSnack(id: string): Promise<Snack> {
    const response = await fetch(`/api/snacks/${id}`);

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch snack');
    }

    return response.json();
}

// Update a snack
export async function updateSnack(
    id: string,
    snack: {
        name: string;
        description: string;
        location: string;
        imageUrl: string;
    }
): Promise<Snack> {
    const response = await fetch(`/api/snacks/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(snack),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update snack');
    }

    return response.json();
}

// Delete a snack
export async function deleteSnack(id: string): Promise<{ success: boolean }> {
    const response = await fetch(`/api/snacks/${id}`, {
        method: 'DELETE',
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete snack');
    }

    return response.json();
}

// Unmatch - delete a match and associated heart history
export async function unmatchUser(matchId: string): Promise<{ success: boolean }> {
    const response = await fetch(`/api/matches/${matchId}`, {
        method: 'DELETE',
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to unmatch');
    }

    return response.json();
}

// Get user's swipe history
export async function getSwipeHistory(): Promise<SwipeHistoryItem[]> {
    const response = await fetch('/api/swipes/history');

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch heart history');
    }

    return response.json();
}

// Undo a swipe
export async function undoSwipe(swipeId: string): Promise<{ success: boolean }> {
    const response = await fetch(`/api/swipes/history?swipeId=${swipeId}`, {
        method: 'DELETE',
    });

    if (!response.ok) {
        // Check if we can parse the error response
        try {
            const error = await response.json();
            throw new Error(error.error || 'Failed to undo heart');
        } catch (parseError) {
            // If we can't parse the JSON, throw a specific error
            if (parseError instanceof SyntaxError) {
                console.error('Invalid JSON response from server:', parseError);
                throw new Error(`Server returned an invalid response (${response.status})`);
            }
            // Re-throw the original error
            throw parseError;
        }
    }

    try {
        return await response.json();
    } catch (parseError) {
        console.error('Error parsing JSON response:', parseError);
        throw new Error('Server returned an invalid success response');
    }
}

// Create an EventSource connection for real-time messages
export function createMessageEventSource(matchId: string, lastMessageTime?: string): EventSource | null {
    if (typeof window === 'undefined') {
        return null; // Server-side rendering, no EventSource available
    }

    const url = new URL(`/api/matches/${matchId}/messages/sse`, window.location.origin);

    if (lastMessageTime) {
        url.searchParams.append('lastMessageTime', lastMessageTime);
    }

    try {
        return new EventSource(url.toString());
    } catch (error) {
        console.error('Failed to create EventSource:', error);
        return null;
    }
}

// Upload an image to Cloudflare R2
export async function uploadImage(file: File): Promise<string> {
    // Create form data
    const formData = new FormData();
    formData.append('file', file);

    // Upload the file
    const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to upload image');
    }

    const data = await response.json();
    return data.url;
}
