//! Guardo un contador por wallet y verifico quién puede modificarlo.

use anchor_lang::prelude::*;

declare_id!("BLjHbkRuZczQxXeuKYi3jLVjJj6QDxE4YVSKGv487v61");

#[program]
pub mod wallet_counter {
    use super::*;

    /// Creo la PDA de mi wallet con el contador en cero.
    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        let counter = &mut ctx.accounts.counter;
        counter.authority = ctx.accounts.authority.key();
        counter.count = 0;
        counter.bump = ctx.bumps.counter;
        Ok(())
    }

    /// Incremento el contador después de validar la autoridad y la PDA.
    pub fn increment(ctx: Context<Increment>) -> Result<()> {
        ctx.accounts.counter.increase()
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(
        init,
        payer = authority,
        space = 8 + Counter::INIT_SPACE,
        seeds = [b"counter", authority.key().as_ref()],
        bump
    )]
    pub counter: Account<'info, Counter>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Increment<'info> {
    pub authority: Signer<'info>,
    #[account(
        mut,
        seeds = [b"counter", counter.authority.as_ref()],
        bump = counter.bump,
        has_one = authority @ CounterError::Unauthorized
    )]
    pub counter: Account<'info, Counter>,
}

/// Guardo la autoridad, el valor y el bump canónico en 41 bytes de datos.
#[account]
#[derive(InitSpace)]
pub struct Counter {
    pub authority: Pubkey,
    pub count: u64,
    pub bump: u8,
}

impl Counter {
    /// Rechazo el desborde antes de cambiar el valor.
    pub fn increase(&mut self) -> Result<()> {
        self.count = self.count.checked_add(1).ok_or(CounterError::Overflow)?;
        Ok(())
    }
}

#[error_code]
pub enum CounterError {
    #[msg("Solo puedo modificar el contador de mi propia wallet.")]
    Unauthorized,
    #[msg("No puedo incrementar el contador porque alcanzó el máximo de u64.")]
    Overflow,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn overflow_keeps_the_previous_value() {
        let mut counter = Counter {
            authority: Pubkey::default(),
            count: u64::MAX,
            bump: 255,
        };
        assert!(counter.increase().is_err());
        assert_eq!(counter.count, u64::MAX);
    }
}
