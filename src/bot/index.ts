import { Client, GatewayIntentBits, Partials, Events, TextChannel, REST, Routes, SlashCommandBuilder } from 'discord.js';
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

  // スラッシュコマンドの登録
  const commands = [
    new SlashCommandBuilder()
      .setName('memos')
      .setDescription('最近のメモを5件表示します'),
    new SlashCommandBuilder()
      .setName('bookmarks')
      .setDescription('最近のブックマークを5件表示します'),
    new SlashCommandBuilder()
      .setName('nowplaying')
      .setDescription('現在再生中の曲を表示します'),
  ].map(command => command.toJSON());

  const rest = new REST({ version: '10' }).setToken(DISCORD_TOKEN);
  try {
    console.log('Started refreshing application (/) commands.');
    await rest.put(
      Routes.applicationCommands(readyClient.user.id),
      { body: commands },
    );
    console.log('Successfully reloaded application (/) commands.');
  } catch (error) {
    console.error('Error registering commands:', error);
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

client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isChatInputCommand()) return;
  if (!appUserId) {
    await interaction.reply({ content: 'システムエラー: ユーザー情報が初期化されていません。', ephemeral: true });
    return;
  }

  if (interaction.commandName === 'memos') {
    await interaction.deferReply(); // 少し時間がかかる場合のため
    try {
      const { data, error } = await supabase
        .from('memos')
        .select('*')
        .eq('user_id', appUserId)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;

      if (!data || data.length === 0) {
        await interaction.editReply('まだメモがありません。');
        return;
      }

      let replyText = '**最近のメモ (最新5件)**\n\n';
      data.forEach((memo: any) => {
        // 画像URLが含まれるマークダウン表記などはそのまま表示されます
        const date = new Date(memo.created_at).toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' });
        replyText += `**[${date}]**\n${memo.content}\n---\n`;
      });

      // Discordの文字数制限(2000文字)を超えないように切り詰め
      if (replyText.length > 2000) {
        replyText = replyText.substring(0, 1995) + '...';
      }

      await interaction.editReply(replyText);
    } catch (err: any) {
      console.error('Slash Command Error:', err);
      await interaction.editReply('メモの取得中にエラーが発生しました。');
    }
  } else if (interaction.commandName === 'bookmarks') {
    await interaction.deferReply();
    try {
      const { data, error } = await supabase
        .from('bookmarks')
        .select('*')
        .eq('user_id', appUserId)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;

      if (!data || data.length === 0) {
        await interaction.editReply('まだブックマークがありません。');
        return;
      }

      let replyText = '**最近のブックマーク (最新5件)**\n\n';
      data.forEach((bm: any) => {
        const date = new Date(bm.created_at).toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' });
        const title = bm.title || bm.author_name || 'タイトルなし';
        replyText += `**[${date}] ${title}**\n${bm.original_url}\n---\n`;
      });

      if (replyText.length > 2000) {
        replyText = replyText.substring(0, 1995) + '...';
      }

      await interaction.editReply(replyText);
    } catch (err: any) {
      console.error('Slash Command Error:', err);
      await interaction.editReply('ブックマークの取得中にエラーが発生しました。');
    }
  } else if (interaction.commandName === 'nowplaying') {
    await interaction.deferReply();
    try {
      let isPlaying = false;
      let title = '';
      let artist = '';
      let url = '';
      let source = '';

      // 1. まずSpotifyが連携されているかチェックし、再生中か確認する
      const { data: settings } = await supabase
        .from('user_settings')
        .select('spotify_refresh_token')
        .eq('user_id', appUserId)
        .single();

      if (settings && settings.spotify_refresh_token) {
        const clientId = process.env.SPOTIFY_CLIENT_ID;
        const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

        if (clientId && clientSecret) {
          const tokenRes = await fetch('https://accounts.spotify.com/api/token', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
              'Authorization': 'Basic ' + Buffer.from(clientId + ':' + clientSecret).toString('base64')
            },
            body: new URLSearchParams({
              grant_type: 'refresh_token',
              refresh_token: settings.spotify_refresh_token
            }),
            cache: 'no-store'
          });

          const tokenData = await tokenRes.json();
          if (!tokenData.error) {
            const playingRes = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
              headers: { 'Authorization': `Bearer ${tokenData.access_token}` },
              cache: 'no-store'
            });

            if (playingRes.status === 200) {
              const playingData = await playingRes.json();
              if (playingData.item && playingData.is_playing) {
                isPlaying = true;
                title = playingData.item.name;
                artist = playingData.item.artists.map((a: any) => a.name).join(', ');
                url = playingData.item.external_urls?.spotify || '';
                source = 'Spotify';
              }
            }
          }
        }
      }

      // 2. Spotifyが再生されていない場合はLast.fmをチェックする
      if (!isPlaying) {
        const lastfmUser = process.env.LASTFM_USERNAME;
        const lastfmApiKey = process.env.LASTFM_API_KEY;

        if (lastfmUser && lastfmApiKey) {
          const res = await fetch(`https://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=${lastfmUser}&api_key=${lastfmApiKey}&format=json&limit=1`, {
            cache: 'no-store'
          });
          if (res.ok) {
            const data = await res.json();
            const tracks = data?.recenttracks?.track;
            if (tracks && tracks.length > 0) {
              const currentTrack = tracks[0];
              if (currentTrack['@attr']?.nowplaying === 'true') {
                isPlaying = true;
                title = currentTrack.name;
                artist = currentTrack.artist?.['#text'] || 'Unknown Artist';
                url = currentTrack.url || '';
                source = 'Last.fm (YouTube Music等)';
              }
            }
          }
        }
      }

      if (isPlaying) {
        await interaction.editReply(`🎵 **Now Playing (${source})**\n**${title}** by ${artist}\n${url}`);
      } else {
        await interaction.editReply('現在再生中の曲は見つかりませんでした。\n（※Spotifyの情報を取得するにはWebポータルから連携するか、YouTube Music等を取得するためにLast.fmを設定してください）');
      }
    } catch (err: any) {
      console.error('Slash Command Error:', err);
      await interaction.editReply('再生中の曲の取得中にエラーが発生しました。');
    }
  }
});

client.login(DISCORD_TOKEN);
