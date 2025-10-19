# Migration 006: Message Sequence Order

## Objetivo
Adicionar uma coluna `sequence_id` à tabela `messages` para ordenação explícita de mensagens em conversas multi-turno, removendo a necessidade do campo `id` dentro do JSON do campo `chat`.

## SQL Migration Script

```sql
-- Adicionar coluna sequence_id à tabela messages
ALTER TABLE messages
ADD COLUMN sequence_id INTEGER;

-- Criar índice para melhor performance na ordenação
CREATE INDEX idx_messages_conversation_sequence 
ON messages(conversation_id, sequence_id);

-- Comentário explicativo
COMMENT ON COLUMN messages.sequence_id IS 'Número sequencial para ordenação de mensagens dentro de uma conversa. Usado principalmente para mensagens multi-turno no campo chat.';
```

## Notas

- A coluna `sequence_id` é nullable por padrão, pois mensagens antigas podem não ter esse valor
- Para mensagens com campo `chat`, o `sequence_id` deve ser populado ao inserir/atualizar
- Mensagens simples (apenas `body`) podem não precisar de `sequence_id`
- A ordenação no front-end usará: `sequence_id ASC` quando disponível, caso contrário `created_at ASC`
