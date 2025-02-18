#![allow(clippy::result_large_err)]

use anchor_lang::prelude::*;

declare_id!("coUnmi3oBUtwtd9fjeAvSsJssXh5A5xyPbhpewyzRVF");

#[program]
pub mod voting {
    use super::*;

    // Initializes a poll
    pub fn initialize_poll(ctx: Context<InitializePoll>, 
                            poll_id: u64,
                            description: String,
                            poll_start: u64,
                            poll_end: u64) -> Result<()> {

        let poll = &mut ctx.accounts.poll;
        poll.poll_id = poll_id;
        poll.description = description;
        poll.poll_start = poll_start;
        poll.poll_end = poll_end;
        poll.candidate_amount = 0;
        Ok(())
    }

    // Initializes a candidate for a given poll
    pub fn initialize_candidate(ctx: Context<InitializeCandidate>, 
                                candidate_name: String,
                                _poll_id: u64
                            ) -> Result<()> {
        let candidate = &mut ctx.accounts.candidate;
        candidate.candidate_name = candidate_name;
        candidate.candidate_votes = 0;
        Ok(())
    }

    // Allows a signer to vote for a candidate, ensuring they can only vote once
    pub fn vote(ctx: Context<Vote>, _candidate_name: String, _poll_id: u64) -> Result<()> {
        // Check if the signer has already voted for this poll
        if ctx.accounts.voter_record.voted {
            return Err(error!(VotingError::AlreadyVoted)); // Return an error if they have already voted
        }

        let candidate = &mut ctx.accounts.candidate;
        candidate.candidate_votes += 1; // Increment the vote for the selected candidate

        // Record that the signer has voted
        let voter_record = &mut ctx.accounts.voter_record;
        voter_record.voted = true;
        voter_record.poll = ctx.accounts.poll.key();

        msg!("Voted for candidate: {}", candidate.candidate_name); // Log the vote
        msg!("Votes: {}", candidate.candidate_votes); // Log the updated vote count
        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(candidate_name: String, poll_id: u64)]
pub struct Vote<'info> {
    #[account(mut)]
    pub signer: Signer<'info>, // The signer (voter) account

    #[account(
        seeds = [poll_id.to_le_bytes().as_ref()], // Unique seeds for poll account
        bump
    )]
    pub poll: Account<'info, Poll>,

    #[account(
      mut,
      seeds = [poll_id.to_le_bytes().as_ref(), candidate_name.as_ref()],
      bump
    )]
    pub candidate: Account<'info, Candidate>,

    // Voter record is created if it doesn't exist; ensures only one vote per user per poll
    #[account(
      init_if_needed,
      payer = signer,
      space = 8 + VoterRecord::INIT_SPACE, // Space allocation for VoterRecord
      seeds = [signer.key().as_ref(), poll_id.to_le_bytes().as_ref()], // Unique seeds for voter record
      bump
    )]
    pub voter_record: Account<'info, VoterRecord>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(candidate_name: String, poll_id: u64)]
pub struct InitializeCandidate<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,

    #[account(
        mut,
        seeds = [poll_id.to_le_bytes().as_ref()],
        bump
    )]
    pub poll: Account<'info, Poll>,

    #[account(
      init,
      payer = signer,
      space = 8 + Candidate::INIT_SPACE,
      seeds = [poll_id.to_le_bytes().as_ref(), candidate_name.as_ref()],
      bump
    )]
    pub candidate: Account<'info, Candidate>,
    pub system_program: Program<'info, System>,
}

#[account]
#[derive(InitSpace)]
pub struct Candidate {
    #[max_len(32)]
    pub candidate_name: String,
    pub candidate_votes: u64, // Vote count for this candidate
}

#[derive(Accounts)]
#[instruction(poll_id: u64)]
pub struct InitializePoll<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,
    #[account(
      init,
      payer = signer,
      space = 8 + Poll::INIT_SPACE,
      seeds = [poll_id.to_le_bytes().as_ref()],
      bump
    )]
    pub poll: Account<'info, Poll>,
    pub system_program: Program<'info, System>,
}

#[account]
#[derive(InitSpace)]
pub struct Poll {
    pub poll_id: u64,
    #[max_len(200)]
    pub description: String, // Description of the poll
    pub poll_start: u64, // Poll start timestamp
    pub poll_end: u64, // Poll end timestamp
    pub candidate_amount: u64, // Number of candidates in the poll
}

#[account]
#[derive(InitSpace)]
pub struct VoterRecord {
    pub voted: bool, // Flag to track if the voter has voted
    pub poll: Pubkey, // The poll the voter has voted in
}

#[error_code]
pub enum VotingError {
    #[msg("This address has already voted for this poll")]
    AlreadyVoted, // Error if the user tries to vote more than once
}
