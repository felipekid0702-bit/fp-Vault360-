# Modelo operacional FP

## Princípio

O FP Vault360° deve representar o ciclo completo do equipamento: recebimento,
identificação, uso, inspeção, decisão, manutenção/quarentena, rastreabilidade,
documentação, descarte e emissão de informação para cliente. A fonte primária é a
documentação técnica; a planilha operacional confirma os campos de controle.

## 1. Recebimento

1. Registrar fornecedor/cliente, NF, data de compra e responsável.
2. Conferir fabricante, modelo, referência, marcações, serial/número individual,
   manual e certificado/documento aplicável.
3. Fotografar identificação e condição inicial.
4. Associar o item a usuário, kit, unidade/local e responsável.
5. Executar inspeção de aquisição/recebimento.
6. Se houver queda, química/abrasivo, temperatura extrema, modificação externa,
   dano ou falta de identificação, separar em quarentena e não liberar.

## 2. Cadastro e identificação

O cadastro mínimo derivado da planilha é: equipamento, usuário, referência, fabricante,
modelo, kit, número individual, NF, primeira utilização, compra, local, inspetor,
data de inspeção e próxima inspeção. O registro deve receber identificador interno
único e, quando adotado pela FP, QR/DataMatrix/NFC/barcode.

Não confundir referência do modelo (ex.: CORDA, POLIA) com número individual do item.
O vínculo de fabricante/modelo/serial e histórico deve ser preservado mesmo após
mudança de usuário, kit ou localização.

## 3. Inspeção

1. Selecionar o equipamento por identificação, nunca por texto ambíguo.
2. Selecionar o template FP aplicável à família e ao tipo de inspeção.
3. Validar histórico de uso e gatilhos de rejeição sistemática.
4. Executar verificação visual, funcional, conforto quando aplicável e resistência
   somente quando o ensaio for autorizado/necessário.
5. Para cada item registrar C/B/AV/AR/R, observação e evidência.
6. Exigir foto em dano, identificação ilegível, achado crítico, reparo, descarte ou
   qualquer decisão que não possa ser demonstrada apenas por texto.
7. Registrar inspetor, local, data, assinatura e próxima inspeção.

## 4. Aprovação e reprovação

- **APTO**: todos os requisitos essenciais conformes, sem gatilho de rejeição e com
  documentação suficiente.
- **INAPTO**: qualquer R, evento crítico, falha funcional, dano incompatível,
  identificação/histórico insuficiente ou ausência de evidência necessária.
- **AV**: exige acompanhamento e prazo; a FP deve decidir se permite uso restrito.
- **AR**: bloqueia o uso até reparo autorizado e reinspeção.

O sistema deve guardar resultado detalhado e veredito, não substituir a decisão
competente por uma soma simples de respostas.

## 5. Quarentena, manutenção e descarte

1. Criar evento de quarentena com motivo, data, local e responsável.
2. Bloquear disponibilidade para uso e movimentação operacional indevida.
3. Abrir ordem/registro de manutenção quando AR for tecnicamente permitido.
4. Registrar serviço, peça, responsável, autorização e documento comprobatório.
5. Reinspecionar após manutenção; nunca retornar diretamente ao status ativo.
6. Para R definitivo, registrar descarte/descaracterização, motivo, método, data,
   responsável e evidência.

## 6. Relatórios e laudos

O relatório deve permitir reconstruir o estado do item em uma data: identificação,
histórico, checklist, classificação por item, fotos, observações, assinatura,
veredito e próxima inspeção. Indicadores executivos devem ser derivados dos registros,
mas o laudo operacional deve manter a evidência original.

## 7. Rastreabilidade

Toda alteração relevante precisa preservar antes/depois, ator, data/hora, origem e
justificativa. Eventos mínimos:

- recebimento/cadastro;
- identificação/etiquetagem;
- atribuição a usuário, kit, unidade ou cliente;
- inspeção e resultado;
- evidência adicionada;
- quarentena, manutenção, retorno ou descarte;
- corte/uso de corda;
- emissão de relatório;
- certificação/treinamento relacionado.

## 8. Controle documental

Documentos do fabricante, certificados, manuais, notas, laudos e fotos devem ter tipo,
versão, origem, data, validade quando existir, equipamento/cliente relacionado,
responsável e permissões. Documento vencido ou ausente não deve ser silenciosamente
tratado como válido.

## 9. Certificações e treinamentos

O catálogo de certificação deve registrar nome, categoria e validade definida pela
fonte competente. Um treinamento é distinto do certificado emitido. A certificação
emitida deve ligar usuário, certificação, treinamento, datas e documento comprobatório.
Vencimento deve gerar alerta; o sistema não deve inventar validade quando a fonte não
informar prazo.

## 10. Clientes, unidades e contratos

- **Cliente**: organização que recebe serviço ou possui equipamentos sob gestão.
- **Unidade/local**: onde o item está ou onde a inspeção ocorreu.
- **Contrato**: escopo, cliente, frequência contratual, SLA, vigência e entregáveis.

O contrato não substitui a ficha técnica: frequência contratual deve coexistir com
periodicidade técnica/fabricante, aplicando-se a condição mais restritiva quando a
política da FP assim determinar.

## 11. Fluxos e responsabilidades

O usuário informa histórico e ocorrências; almoxarifado controla posse, localização e
quarentena; inspetor competente executa e assina; gestor técnico resolve AR/R,
manutenção e descarte; administração controla clientes, unidades, contratos e
documentos; direção acompanha indicadores e aprova políticas.

## 12. Decisões pendentes antes de automatizar

- periodicidades exatas por família e tipo;
- matriz AV/AR e uso restrito;
- campos obrigatórios por cliente/contrato;
- política de retenção de fotos, laudos e audit log;
- autoridade final para retorno de quarentena;
- modelo oficial de laudo e assinatura digital;
- regras de descarte e evidência mínima.
