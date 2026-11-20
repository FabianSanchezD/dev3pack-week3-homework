use anchor_lang::prelude::*;

declare_id!("8kXcQPkzwhvKgKxDvhzQgb2dRnAFMi1ZTYz6ARYgSHq7");

#[program]
pub mod museum_guestbook {
    use super::*;

    pub fn create_tour(
        ctx: Context<CreateTour>,
        tour_id: u64,
        name: String,
        description: String,
        duration: u16) -> Result<()>{
        let tour = &mut ctx.accounts.tour;

        tour.authority = ctx.accounts.authority.key();
        tour.tour_id = tour_id;
        tour.name = name;
        tour.description = description;
        tour.duration = duration;
        tour.review_count = 0;

        Ok(())
    }
}

#[derive(Accounts)]
pub struct LeaveReview<'info> {
    #[account(mut)]
    pub visitor: Signer<'info>,
    #[account(mut)]
    pub tour: Account<'info, TourAccount>,
    #[account(
        init,
        payer = visitor,
        space = 8 + ReviewAccount::INIT_SPACE,
        seeds = [b"review", tour.key().as_ref(),&tour.review_count.to_le_bytes()],
        bump
    )]
    pub review: Account<'info, ReviewAccount>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(tour_id: u64)]
pub struct CreateTour<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(
        init,
        payer = authority,
        space = 8 + TourAccount::INIT_SPACE,
        seeds = [b"tour", authority.key().as_ref(), &tour_id.to_le_bytes()],
        bump
    )]
    pub tour: Account<'info, TourAccount>,
    pub system_program: Program<'info, System>,
}

#[account]
#[derive(InitSpace)]
pub struct TourAccount {
    pub authority: Pubkey,
    pub tour_id: u64,
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
