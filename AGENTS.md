# Frontend project guidance

## Attendance list / Kadris statuses

The attendance list is implemented in `src/pages/HomePage.vue`. Kadris supplies
`status_code`, `status_label`, `status_group`, `status_emoji`,
`location_label`, `started_at`, and `ended_at`. The canonical backend mapping is
in `../be/sys/class.kadris.php`; keep the frontend compatible with it instead of
replacing Kadris labels with independently invented meanings.

Known status codes:

| Code | Meaning | Group / semaphore | Emoji |
| --- | --- | --- | --- |
| `RED` | Redno delo | `office` / green | 🏢 |
| `DOM` | Delo na domu | `home` / green | 🏠 |
| `DOMO` | Delo izven delovnega mesta odobreno | `home` / green | 🏠 |
| `DOMP` | Delo na domu planirano | `home` / green | 🏠 |
| `DOP` | Dopust | `leave` / red | 🌴 |
| `KPU` | Koriščenje presežka ur; treat like dopust | red | Use the backend emoji when one is supplied |
| `GDO` | Nagradni dopust | `leave` / red | 🌴 |
| `POR` | Porodniška odsotnost | `leave` / red | 🍼 |
| `S` | Službena pot, potni nalog | `business_trip` / green | 🚗 |
| `SLU` | Službena odsotnost | `business_trip` / green | 💼 |
| `PRI` | Privatna odsotnost | `leave` / red | ⏳ |
| `NAD` | Nadurno delo | `office` / green | 🏢 |
| `NEE` | Neenakomerno razporejen delovni čas (42. člen KPJS) | `office` / green | 🏢 |
| `NESK` | Poškodba pri delu do 30 dni, oproščeni prispevki | `sick_leave` / red | 🤕 |
| `NESR` | Poškodba pri delu do 30 dni, refundacija | `sick_leave` / red | 🤕 |
| `FINISHED_WORK` | Današnje delo je zaključeno | `finished_work` / red | 😴 |
| `MANKO` | Manjkajoča vrsta dela | `unknown` / amber | ❔ |
| `???` | Neznan oziroma napačen Kadris status | `unknown` / amber | ❔ |
| `NO_DATA` | Za uporabnika ni sinhroniziranega statusa | `unknown` / amber | ❔ |

`KPU` is an explicit frontend exception until the backend classifies it as
`leave`: it must always render with the red/away semaphore, like `DOP`. Its
former amber/yellow rendering was the accidental `unknown` fallback, not the
intended meaning.
Business trips count as present (green), while leave, sick leave, KPU, and
finished work count as away (red). Unmapped or missing data remains
unknown (amber).

Git history before `simplify attendance list` (`c1b2efb`) contains the fuller
presentation and is useful if it is restored:

- The table showed the Kadris emoji and short status code, the long label, a
  start time, and a separate semaphore/availability badge.
- Full-day leave and sick leave displayed `Cel dan`; finished work used
  `ended_at` and hid the synthetic `FINISHED_WORK` code.
- Availability sorting was green/present, external collaborator, red/away,
  then amber/unknown.
- User ID `2` was shown as an external collaborator with 🦅; user ID `34` was
  shown as an external collaborator with 🔧 and `5 ur na teden` /
  `Občasno`. These are historical display exceptions, not Kadris status
  meanings.
