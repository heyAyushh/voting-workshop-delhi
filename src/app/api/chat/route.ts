import { NextResponse } from 'next/server';
import { OpenAI } from 'openai';
import { Connection, PublicKey } from '@solana/web3.js';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const connection = new Connection(process.env.RPC_URL || 'https://api.devnet.solana.com');

export async function POST(req: Request) {
  try {
    const { messages, wallet } = await req.json();

    // Get wallet information if available
    let walletInfo = '';
    if (wallet) {
      try {
        const pubkey = new PublicKey(wallet);
        const balance = await connection.getBalance(pubkey);
        walletInfo = `\nWallet Address: ${wallet}\nBalance: ${balance / 1e9} SOL`;
      } catch (error) {
        console.error('Error fetching wallet info:', error);
      }
    }

    const systemMessage = {
      role: 'system',
      content: `You are a helpful assistant for a Solana-based voting dApp. You can help users understand how to vote, check their wallet status, and interact with the voting system.${walletInfo}`,
    };

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [systemMessage, ...messages],
      temperature: 0.7,
      max_tokens: 500,
    });

    return NextResponse.json({
      response: completion.choices[0].message.content,
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}
