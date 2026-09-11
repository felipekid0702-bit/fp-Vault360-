-- Permite cadastrar equipamento de cliente antes do vínculo operacional com um serviço.
-- O serviço continua disponível para vínculo/edição posterior.
alter table equipment
  drop constraint if exists chk_equipment_client_service;
