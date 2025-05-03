import { Message } from '@/lib/api';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface MessageBubbleProps {
    message: Message;
}

export function MessageBubble({ message }: MessageBubbleProps) {
    // Format timestamp
    const timestamp = message.createdAt ? format(new Date(message.createdAt), 'h:mm a') : '';

    return (
        <div className={cn('flex flex-col mb-4', message.isMine ? 'items-end' : 'items-start')}>
            <div
                className={cn(
                    'max-w-[80%] px-4 py-2 rounded-lg text-sm',
                    message.isMine ? 'bg-primary text-primary-foreground rounded-tr-none' : 'bg-muted rounded-tl-none'
                )}
            >
                {message.content}
            </div>
            <span className="text-xs text-muted-foreground mt-1">{timestamp}</span>
        </div>
    );
}
