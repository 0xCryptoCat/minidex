import crypto from 'crypto';

// Telegram Bot API types
interface TelegramUser {
  id: number;
  is_bot: boolean;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  is_premium?: boolean;
}

interface ChatMember {
  status: 'creator' | 'administrator' | 'member' | 'restricted' | 'left' | 'kicked';
  user: TelegramUser;
  until_date?: number;
  can_be_edited?: boolean;
  can_manage_chat?: boolean;
  can_change_info?: boolean;
  can_delete_messages?: boolean;
  can_invite_users?: boolean;
  can_restrict_members?: boolean;
  can_pin_messages?: boolean;
  can_promote_members?: boolean;
  can_manage_video_chats?: boolean;
  can_manage_topics?: boolean;
  is_anonymous?: boolean;
  can_send_messages?: boolean;
  can_send_audios?: boolean;
  can_send_documents?: boolean;
  can_send_photos?: boolean;
  can_send_videos?: boolean;
  can_send_video_notes?: boolean;
  can_send_voice_notes?: boolean;
  can_send_polls?: boolean;
  can_send_other_messages?: boolean;
  can_add_web_page_previews?: boolean;
}

interface TelegramApiResponse<T> {
  ok: boolean;
  result: T;
  description?: string;
  error_code?: number;
}

// Verify Telegram WebApp init data
function verifyTelegramData(initData: string, botToken: string): boolean {
  try {
    const params = new URLSearchParams(initData);
    const hash = params.get('hash');
    params.delete('hash');
    
    // Sort parameters
    const sortedParams = Array.from(params.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');
    
    // Create secret key
    const secretKey = crypto
      .createHmac('sha256', 'WebAppData')
      .update(botToken)
      .digest();
    
    // Calculate expected hash
    const expectedHash = crypto
      .createHmac('sha256', secretKey)
      .update(sortedParams)
      .digest('hex');
    
    return expectedHash === hash;
  } catch (error) {
    console.error('Error verifying Telegram data:', error);
    return false;
  }
}

// Check if user is in the group
async function checkGroupMembership(userId: number, groupId: string, botToken: string): Promise<boolean> {
  try {
    const response = await fetch(
      `https://api.telegram.org/bot${botToken}/getChatMember`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: groupId,
          user_id: userId,
        }),
      }
    );

    if (!response.ok) {
      console.error('Telegram API error:', response.status, response.statusText);
      return false;
    }

    const data: TelegramApiResponse<ChatMember> = await response.json();

    if (!data.ok) {
      console.error('Telegram API returned error:', data.description);
      return false;
    }

    // User is considered a member if they have any of these statuses
    const memberStatuses = ['creator', 'administrator', 'member'];
    return memberStatuses.includes(data.result.status);

  } catch (error) {
    console.error('Error checking group membership:', error);
    return false;
  }
}

export default async function handler(request: Request) {
  // Only allow POST requests
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const { initData, userId } = await request.json();

    // Validate required environment variables
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const groupId = process.env.TELEGRAM_GROUP_ID;

    if (!botToken || !groupId) {
      console.error('Missing required environment variables:', { 
        hasBotToken: !!botToken, 
        hasGroupId: !!groupId 
      });
      return new Response(JSON.stringify({ 
        error: 'Server configuration error',
        isGroupMember: false 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Validate input data
    if (!initData || !userId) {
      return new Response(JSON.stringify({ 
        error: 'Missing required parameters',
        isGroupMember: false 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Verify Telegram WebApp data integrity
    const isValidData = verifyTelegramData(initData, botToken);
    if (!isValidData) {
      return new Response(JSON.stringify({ 
        error: 'Invalid Telegram data',
        isGroupMember: false 
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Check group membership
    const isGroupMember = await checkGroupMembership(userId, groupId, botToken);

    return new Response(JSON.stringify({ 
      success: true,
      isGroupMember,
      userId,
    }), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });

  } catch (error) {
    console.error('Telegram auth error:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      isGroupMember: false 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
