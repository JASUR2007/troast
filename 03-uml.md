# UML Troast
Предложенная архитектура на основании ТЗ. Mermaid-блоки можно открыть в редакторе с поддержкой Mermaid.

## Диаграмма классов
```mermaid
classDiagram
class Profile {
 uuid id
 string display_name
 Role role
}
class Object {
 uuid id
 string name
 string address
}
class Task {
 uuid id
 string title
 string description
 uuid assignee_id
 uuid author_id
 Status status
 timestamp created_at
}
class TaskHistory {
 uuid id
 uuid actor_id
 Status from_status
 Status to_status
 string comment
 timestamp created_at
}
Object "1" --> "0..*" Task : contains
Profile "1" --> "0..*" Task : assigned
Profile "1" --> "0..*" Task : authored
Task "1" --> "0..*" TaskHistory : history
Profile "1" --> "0..*" TaskHistory : actor
```

## Состояния задачи
```mermaid
stateDiagram-v2
[*] --> New : постановщик создаёт
New --> InProgress : назначенный исполнитель
InProgress --> Review : назначенный исполнитель
Review --> Accepted : постановщик
Review --> Rework : постановщик, комментарий обязателен
Rework --> InProgress : назначенный исполнитель
Accepted --> [*]
```

## Последовательность изменения статуса
```mermaid
sequenceDiagram
actor U as Пользователь
participant UI as React
participant Auth as Supabase Auth
participant API as Supabase RPC
participant DB as PostgreSQL
U->>UI: Выбрать разрешённое действие
UI->>Auth: Получить действующую сессию
Auth-->>UI: JWT
UI->>API: transition_task(id, expected, target, comment), JWT
API->>DB: Начать транзакцию, заблокировать задачу
DB->>DB: Проверить auth.uid, роль, назначение, переход
alt Разрешено
DB->>DB: Изменить статус и добавить историю триггером
DB-->>API: Commit
API-->>UI: Результат
UI-->>U: Обновлённая задача и история
else Запрещено или конфликт
DB-->>API: Rollback / ошибка
API-->>UI: Ошибка доступа, перехода или конфликт
UI-->>U: Понятное сообщение
end
```

## Компоненты
```mermaid
flowchart LR
A[React / TypeScript] --> B[Supabase Auth]
A --> C[PostgREST / RPC]
C --> D[PostgreSQL: RLS + проверки + триггеры]
D --> E[objects / tasks / profiles / history]
```
