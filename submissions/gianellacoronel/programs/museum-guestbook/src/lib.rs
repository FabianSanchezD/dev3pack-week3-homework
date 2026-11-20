use anchor_lang::prelude::*;

declare_id!("8kXcQPkzwhvKgKxDvhzQgb2dRnAFMi1ZTYz6ARYgSHq7");

#[program]
pub mod museum_guestbook {
    use super::*;


}

#[account]
#[derive(InitSpace)]
pub struct TourAccount {
    #[max_len(50)]
    pub name: String,
    #[max_len(200)]
    pub description: String,
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
