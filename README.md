# FactureDoc AI

> SaaS de generation de devis et factures par IA pour le marche francais

## Stack technique

- **Frontend**: Next.js 14 App Router + TypeScript + Tailwind CSS
- **Backend**: Next.js API Routes + Supabase (PostgreSQL + Auth + Storage)
- **IA**: API Anthropic Claude (claude-sonnet-4-20250514)
- **Paiements**: Stripe (abonnements + liens de paiement)
- **Emails**: Resend (transactionnel + relances automatiques)
- **PDF**: @react-pdf/renderer
- **Signature**: react-signature-canvas
- **Deploiement**: Vercel

## Deploiement en 10 minutes sur Vercel

### Etape 1 - Supabase (2 min)

1. Creez un compte sur [supabase.com](https://supabase.com)
2. Creez un nouveau projet
3. Dans **SQL Editor**, copiez et executez le contenu de `supabase/migrations/001_initial_schema.sql`
4. Dans **Settings > API**, copiez :
   - `Project URL` -> `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` -> `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` -> `SUPABASE_SERVICE_ROLE_KEY`

### Etape 2 - Anthropic (1 min)

1. Allez sur [console.anthropic.com](https://console.anthropic.com)
2. Creez une API Key -> `ANTHROPIC_API_KEY`

### Etape 3 - Stripe (3 min)

1. Creez un compte sur [stripe.com](https://stripe.com)
2. Dans **Developers > API keys** :
   - `Secret key` -> `STRIPE_SECRET_KEY`
   - `Publishable key` -> `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
3. Creez 3 produits avec prix recurrents mensuels :
   - Starter 19 EUR/mois -> copier Price ID -> `STRIPE_PRICE_STARTER`
   - Pro 49 EUR/mois -> `STRIPE_PRICE_PRO`
   - Business 99 EUR/mois -> `STRIPE_PRICE_BUSINESS`
4. Apres deploiement, configurez le webhook Stripe :
   - URL : `https://votre-app.vercel.app/api/stripe/webhook`
   - Evenements : `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`
   - Secret -> `STRIPE_WEBHOOK_SECRET`

### Etape 4 - Resend (1 min)

1. Creez un compte sur [resend.com](https://resend.com)
2. Creez une API Key -> `RESEND_API_KEY`
3. Verifiez votre domaine (optionnel pour les tests)

### Etape 5 - Deploiement Vercel (3 min)

1. Allez sur [vercel.com](https://vercel.com)
2. Cliquez **Add New Project** -> importez ce repo GitHub
3. Dans **Environment Variables**, ajoutez toutes les variables de `.env.example`
4. `NEXT_PUBLIC_APP_URL` = l'URL de votre app Vercel (disponible apres premier deploiement)
5. `CRON_SECRET` = generez avec `openssl rand -hex 32`
6. Cliquez **Deploy** !

## Variables d'environnement requises

Copiez `.env.example` en `.env.local` et remplissez les valeurs.

## Fonctionnalites

- **Auth Supabase** - Inscription, connexion, middleware de protection
- **Generation IA** - Appel Claude pour creer devis/factures depuis description textuelle
- **Editeur de document** - Edition des lignes, calcul auto HT/TVA/TTC
- **Apercu PDF live** - Rendu en temps reel
- **Envoi email** - Lien de visualisation unique avec tracking des vues
- **Signature electronique** - Canvas, sauvegarde image, horodatage + IP
- **Paiement Stripe** - Payment Links integres dans les documents
- **Abonnements** - 4 plans (Free/Starter/Pro/Business)
- **Relances auto** - Cron Vercel a J+3/J+7/J+14
- **Chat IA** - Conversation contextuelle dans chaque document

## Plans

| Plan | Prix | Documents | Credits IA |
|------|------|-----------|------------|
| Free | 0 EUR/mois | 5 | 10 |
| Starter | 19 EUR/mois | 50 | 100 |
| Pro | 49 EUR/mois | 500 | 1000 |
| Business | 99 EUR/mois | Illimite | Illimite |

## Architecture

```
facturedoc-ai/
├── app/
│   ├── (auth)/          # Pages login/signup
│   ├── (dashboard)/     # Application principale (protegee)
│   ├── view/[token]/    # Page publique client
│   ├── sign/[token]/    # Signature electronique
│   └── api/             # Routes API
├── components/          # Composants React
├── lib/                 # Logique metier
│   ├── supabase/        # Client + types
│   ├── ai/              # Generation IA
│   ├── stripe/          # Paiements
│   ├── email/           # Emails
│   └── utils/           # Utilitaires
└── supabase/
    └── migrations/      # Schema SQL
```

## Developpement local

```bash
git clone https://github.com/poku11/facturedoc-ai
cd facturedoc-ai
npm install
cp .env.example .env.local
# Remplissez .env.local avec vos valeurs
npm run dev
```

## License

MIT - Cree avec Claude by Anthropic
