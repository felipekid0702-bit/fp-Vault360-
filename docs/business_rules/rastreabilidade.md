# Rastreabilidade operacional FP

## 1. Chaves e identificação

O registro operacional usa a combinação de equipamento, referência, fabricante, modelo,
número individual/serial e identificador interno. NF, data de compra e primeira
utilização preservam a origem. QR/DataMatrix/NFC/barcode são meios de consulta, não
substituem o identificador persistente.

## 2. Campos da planilha oficial

| Campo | Obrigatoriedade operacional | Uso |
|---|---|---|
| Equipamento | obrigatória | família/modelo de ficha |
| Usuário | quando atribuído | posse/responsabilidade |
| Referência | obrigatória | tipo FP |
| Fabricante | obrigatória quando disponível | compatibilidade/manual |
| Modelo | obrigatória quando disponível | identificação técnica |
| kit | opcional | agrupamento operacional |
| Nº Individual | obrigatório para rastreio individual | chave física |
| NF | obrigatório quando disponível | origem/aquisição |
| 1ª Utiliz. | obrigatório quando conhecido | ciclo de vida |
| Data da Inspeção | obrigatória | histórico |
| Inspecionado por | obrigatória | responsabilidade |
| próxima Insp. | obrigatória após controle | vencimento |
| Data da Compra | obrigatória quando conhecida | origem |
| Local da Inspeção | obrigatória | contexto/evidência |

## 3. Histórico mínimo

Manter linha do tempo de cadastro, recebimento, etiquetas, usuário, kit, unidade,
movimentações, inspeções, resultados por item, evidências, manutenção, quarentena,
retorno, certificações relacionadas, cortes/uso de cordas e descarte.

Cada evento deve ter ator, data/hora, origem, equipamento, estado anterior, estado
novo e justificativa/documento quando aplicável.

## 4. Vencimentos

Controlar próxima inspeção, validade de certificação, validade documental e vigência
contratual separadamente. O material oficial não autoriza um prazo único; cada prazo
deve possuir origem (fabricante, norma, contrato, política FP) e responsável.

## 5. Fotos e documentos

Fotos obrigatórias: identificação, dano, não conformidade, reparo, descarte,
quarentena e qualquer situação em que texto não seja evidência suficiente. Associar
metadados de data, autor, equipamento, inspeção e legenda.

## 6. Kits

O kit é agrupamento rastreável; seus componentes mantêm identidade individual. O
estado do kit não pode apagar o estado dos itens. A disponibilidade do kit deve
considerar o pior estado/validade dos componentes e registrar qual componente causou
restrição.

## 7. Certificações e treinamentos

Distinguir catálogo (tipo de certificação), curso/treinamento e emissão para pessoa.
Registrar pessoa, certificação, treinamento, emissão, vencimento, documento, emissor,
status e histórico de renovação.
