import { Client, GatewayIntentBits, Partials, Events, TextChannel } from 'discord.js';
import { createClient } from '@supabase/supabase-js';
import cron from 'node-cron';
import * as cheerio from 'cheerio';

const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!DISCORD_TOKEN || !SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.log('Discord Bot: Missing DISCORD_TOKEN or SUPABASE_SERVICE_ROLE_KEY. Skipping bot startup.');
  process.exit(0);
}

// サービスロールキーを使ってサーバーサイド用クライアントを作成 (RLSバイパス可能)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
let appUserId = '';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ],
  partials: [Partials.Channel]
});

client.once(Events.ClientReady, async (readyClient) => {
  console.log(`Discord Bot Ready! Logged in as ${readyClient.user.tag}`);
  
  // ユーザーIDの取得 (システム内の最初のユーザーをオーナーとみなす)
  const { data, error } = await supabase.auth.admin.listUsers();
  if (data && data.users && data.users.length > 0) {
    appUserId = data.users[0].id;
    console.log(`Bot bound to Supabase user: ${appUserId}`);
  } else {
    console.error('No users found in Supabase Auth. Bot cannot save data.');
  }

  // リマインダー設定 (毎日22:00に通知)
  cron.schedule('0 22 * * *', () => {
    // ボットが参加している最初のテキストチャンネルを探して送信
    const guild = client.guilds.cache.first();
    if (guild) {
      const channel = guild.channels.cache.find(c => c.isTextBased() && c.name.includes('memo')) || 
                      guild.channels.cache.find(c => c.isTextBased());
      if (channel && channel.isTextBased()) {
        (channel as TextChannel).send('🌙 夜の22時です！今日のメンタルスコアと飲酒記録は付けましたか？\nWebポータルまたはコマンドから記録しましょう！');
      }
    }
  });
});

client.on(Events.MessageCreate, async (message) => {
  if (message.author.bot) return;
  if (!appUserId) return;

  const content = message.content || '';
  const attachments = Array.from(message.attachments.values());
  
  // Discord CDNの画像URLを取得
  let imageUrl = '';
  if (attachments.length > 0) {
    const att = attachments[0];
    if (att.contentType?.startsWith('image/')) {
      imageUrl = att.url;
    }
  }

  if (!content && !imageUrl) return;

  // タグ抽出
  const tagMatches = content.match(/#([^\s#]+)/g) || [];
  const tags = tagMatches.map(t => t.slice(1));

  // URL判定
  const urlRegex = /(https?:\/\/[^\s]+)/;
  const urlMatch = content.match(urlRegex);

  try {
    if (urlMatch) {
      const url = urlMatch[0];
      const twitterRegex = /https?:\/\/(?:twitter\.com|x\.com)\/([^/]+)\/status\/(\d+)/;
      const twitterMatch = url.match(twitterRegex);

      if (twitterMatch) {
        const username = twitterMatch[1];
        const tweetId = twitterMatch[2];
        const res = await fetch(`https://api.vxtwitter.com/${username}/status/${tweetId}`);
        if (res.ok) {
          const data = await res.json();
          await supabase.from('bookmarks').insert({
            user_id: appUserId,
            original_url: url,
            fxtwitter_url: `https://fxtwitter.com/${username}/status/${tweetId}`,
            author_name: data.user_name || '',
            author_handle: data.user_screen_name || username,
            author_icon_url: data.user_profile_image_url || '',
            content: data.text || '',
            image_url: (data.mediaURLs && data.mediaURLs.length > 0) ? data.mediaURLs[0] : imageUrl,
            tags: tags
          });
          await message.react('🔖');
          return;
        }
      }

      // 一般のURLの場合 (OGP解析)
      const res = await fetch(url, { headers: { 'User-Agent': 'bot' } });
      if (res.ok) {
        const html = await res.text();
        const $ = cheerio.load(html);
        const title = $('meta[property="og:title"]').attr('content') || $('title').text() || '';
        const description = $('meta[property="og:description"]').attr('content') || $('meta[name="description"]').attr('content') || '';
        const image = $('meta[property="og:image"]').attr('content') || imageUrl;
        const siteName = $('meta[property="og:site_name"]').attr('content') || '';

        await supabase.from('bookmarks').insert({
          user_id: appUserId,
          original_url: url,
          content: content,
          title: title,
          description: description,
          image_url: image,
          site_name: siteName,
          tags: tags
        });
        await message.react('🔖');
        return;
      }
    }

    // URLがない、または取得に失敗した場合はメモとして保存
    // メモテーブルにはimage_urlカラムがないため、マークダウンでテキスト内に画像を表示させる
    let finalContent = content;
    if (imageUrl) {
      finalContent = finalContent ? `${finalContent}\n\n![image](${imageUrl})` : `![image](${imageUrl})`;
    }
    
    await supabase.from('memos').insert({
      user_id: appUserId,
      content: finalContent,
      tags: tags
    });
    await message.react('📝');

  } catch (err: any) {
    console.error('Bot Error:', err.message);
    await message.react('❌');
  }
});

client.login(DISCORD_TOKEN);
