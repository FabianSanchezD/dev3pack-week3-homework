use anchor_lang::prelude::*;

declare_id!("8kXcQPkzwhvKgKxDvhzQgb2dRnAFMi1ZTYz6ARYgSHq7");

#[program]
pub mod museum_guestbook {
    use super::*;


}

#[derive(Accounts)]
pub struct CreateTour<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(
        init,
        payer = authority,
        space = 8 + TourAccount::INIT_SPACE,
        seeds = [b"tour", authority.key().as_ref()],
        bump
    )]
    pub tour: Account<'info, TourAccount>,
    pub system_program: Program<'info, System>,
}

#[account]
#[derive(InitSpace)]
pub struct TourAccount {
    #[max_len(50)]
    pub name: String,
    #[max_len(200)]
    pub description: String,
    pub duration: u16,
    pub review_count: u64,
}

#[account]
#[derive(InitSpace)]
pub struct ReviewAccount {
    pub tour: Pubkey,
    pub visitor: Pubkey,
    #[max_len(200)]
    pub message: String,
    pub timestamp: i64,
}
