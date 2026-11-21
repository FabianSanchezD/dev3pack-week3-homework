use std::assert_eq;

use anchor_lang::{
    AccountDeserialize, InstructionData, ToAccountMetas, prelude::Pubkey, solana_program::{instruction::Instruction, system_program},
};
use litesvm::LiteSVM;
use solana_keypair::Keypair;
use solana_signer::Signer;
use solana_transaction::Transaction;

#[test]
fn test_create_tour() {
    // 1. Inicializar LiteSVM y cargar el programa
    let mut svm = LiteSVM::new();

    let _ = svm.add_program(
        museum_guestbook::ID,
        include_bytes!("../../../target/deploy/museum_guestbook.so"),
    );

    // 2. Crear wallet y financiarla
    let authority = Keypair::new();
    let _ = svm.airdrop(&authority.pubkey(), 10_000_000_000);

    // 3. Preparar los datos del tour
    let tour_id = 1u64;
    let name = "Tour histórico".to_string();
    let description = "Recorrido por Lugar de la Memoria, la Tolerancia y la Inclusión Social (LUM)".to_string();
    let duration = 60u16;

    // 4. Derivar la PDA del tour
    let tour_id_bytes = tour_id.to_le_bytes();

    let (tour_pda, _bump) = Pubkey::find_program_address(
        &[
            b"tour",
            authority.pubkey().as_ref(),
            &tour_id_bytes,
        ],
        &museum_guestbook::ID
    );

    // 5. Construir la instrucción
    let accounts = museum_guestbook::accounts::CreateTour {
        authority: authority.pubkey(),
        tour: tour_pda,
        system_program: system_program::ID,
    };

    let instruction_data = museum_guestbook::instruction::CreateTour {
        tour_id,
        name: name.clone(),
        description: description.clone(),
        duration,
    };

    let instruction = Instruction {
        program_id: museum_guestbook::ID,
        accounts: accounts.to_account_metas(None),
        data: instruction_data.data(),
    };

    // 6. Firmar y enviar la transacción
    let transaction = Transaction::new_signed_with_payer(
        &[instruction],
        Some(&authority.pubkey()),
        &[&authority],
        svm.latest_blockhash(),
    );

    let result = svm.send_transaction(transaction);

    assert!(
        result.is_ok(),
        "La transacción falló: {:?}",
        result.err(),
    );

    // 7. Recuperar y deserializar la cuenta
    let account = svm.get_account(&tour_pda).unwrap();

    let tour = museum_guestbook::TourAccount::try_deserialize(
        &mut account.data.as_slice()
    ).unwrap();

    // 8. Verificar los datos almacenados
    assert_eq!(tour.authority, authority.pubkey());
    assert_eq!(tour.tour_id, tour_id);
    assert_eq!(tour.name, name);
    assert_eq!(tour.description, description);
    assert_eq!(tour.duration, duration);
    assert_eq!(tour.review_count, 0);

}
