import { useEffect, useState } from 'react'
import { BrowserRouter, Link, Route, Routes, useNavigate } from 'react-router-dom'
import './App.css'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

type AuthState = {
  token: string | null
  email: string | null
}

type Product = {
  id: number
  name: string
  price: number
  image_url?: string | null
  stock: number
}

type CartItem = {
  id: number
  product_id: number
  quantity: number
}

type CartResponse = {
  id: number
  items: CartItem[]
}

function HomePage() {
  return (
    <div className="app-main app-main-wide">
      <div className="app-main-col">
        <section className="app-card stack-md">
          <div className="section-header">
            <div>
              <div className="section-kicker">Plateforme e‑commerce PC</div>
              <h1 className="hero-heading">
                Monte ton <span className="hero-highlight">setup gaming</span> comme un pro.
              </h1>
            </div>
          </div>
          <p className="section-subtitle">
            Catalogue de composants, panier dynamique, configs personnalisées et paiement sécurisé à venir.
          </p>
          <div className="hero-badges">
            <div className="hero-badge">GPU, CPU, RAM, SSD, PC complets</div>
            <div className="hero-badge">FastAPI · React · Supabase · Stripe</div>
            <div className="hero-badge">Interface admin et configurateur PC en préparation</div>
          </div>
          <div className="form-actions">
            <Link to="/catalog">
              <button type="button">Découvrir le catalogue</button>
            </Link>
          </div>
        </section>
        <section className="app-card app-card-secondary stack-md">
          <div className="section-header">
            <div>
              <div className="section-kicker">En un coup d’œil</div>
              <h2 className="section-title">Fonctionnalités déjà en place</h2>
            </div>
          </div>
          <div className="pill-ghost-group">
            <div className="pill-ghost pill-ghost-strong">Inscription / Connexion JWT</div>
            <div className="pill-ghost pill-ghost-accent">Catalogue de produits</div>
            <div className="pill-ghost">Panier lié au compte</div>
            <div className="pill-ghost">Base de données Supabase structurée</div>
          </div>
        </section>
      </div>
    </div>
  )
}

function CatalogPage({ auth }: { auth: AuthState }) {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true)
        setError(null)
        const res = await fetch(`${API_BASE_URL}/products`)
        if (!res.ok) {
          throw new Error('Erreur lors du chargement des produits')
        }
        const data = (await res.json()) as Product[]
        setProducts(data)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Erreur inconnue')
      } finally {
        setLoading(false)
      }
    }
    run()
  }, [])

  const handleAddToCart = async (productId: number) => {
    if (!auth.token) {
      setMessage('Connecte-toi pour ajouter au panier.')
      return
    }
    try {
      setMessage(null)
      const res = await fetch(`${API_BASE_URL}/cart/items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${auth.token}`,
        },
        body: JSON.stringify({ product_id: productId, quantity: 1 }),
      })
      if (!res.ok) {
        throw new Error('Erreur lors de l’ajout au panier')
      }
      setMessage('Produit ajouté au panier')
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Erreur inconnue')
    }
  }

  if (loading) {
    return (
      <div className="app-main app-main-wide">
        <div className="app-main-col">
          <section className="app-card">
            <p className="muted">Chargement du catalogue...</p>
          </section>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="app-main app-main-wide">
        <div className="app-main-col">
          <section className="app-card">
            <p className="message message-error">{error}</p>
          </section>
        </div>
      </div>
    )
  }

  return (
    <div className="app-main">
      <div className="app-main-col">
        <section className="app-card stack-md">
          <div className="section-header">
            <div>
              <div className="section-kicker">Composants</div>
              <h2 className="section-title">Catalogue</h2>
            </div>
            <span className="badge-soft">{products.length} produits</span>
          </div>
          <p className="section-subtitle">
            Ajoute des composants à ton panier. Les filtres avancés et la recherche intelligente arriveront ensuite.
          </p>
          {message && <p className="message">{message}</p>}
          <div className="product-grid">
            {products.map((p) => (
              <article key={p.id} className="product-card">
                <div className="stack-sm">
                  <h3 className="product-name">{p.name}</h3>
                  <p className="product-price">{p.price.toFixed(2)} €</p>
                </div>
                {p.image_url && (
                  <img className="product-image" src={p.image_url} alt={p.name} />
                )}
                <div className="product-footer">
                  <div className="pill">
                    <span className="pill-dot" />
                    <span>{p.stock > 0 ? `En stock: ${p.stock}` : 'Rupture de stock'}</span>
                  </div>
                  {p.stock > 0 ? (
                    <button type="button" onClick={() => handleAddToCart(p.id)}>
                      Ajouter au panier
                    </button>
                  ) : (
                    <button type="button" disabled>
                      Indisponible
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
      <div className="app-main-col">
        <section className="app-card app-card-secondary stack-md">
          <div className="section-header">
            <div>
              <div className="section-kicker">À venir</div>
              <h2 className="section-title">Configurateur PC</h2>
            </div>
          </div>
          <p className="section-subtitle">
            Ici tu pourras bientôt composer une config complète (CPU, GPU, RAM, SSD, PSU, boîtier) avec vérification de
            compatibilité.
          </p>
        </section>
      </div>
    </div>
  )
}

function CartPage({ auth }: { auth: AuthState }) {
  const [cart, setCart] = useState<CartResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    const run = async () => {
      if (!auth.token) {
        setLoading(false)
        return
      }
      try {
        setLoading(true)
        setError(null)
        const res = await fetch(`${API_BASE_URL}/cart`, {
          headers: {
            Authorization: `Bearer ${auth.token}`,
          },
        })
        if (!res.ok) {
          throw new Error('Erreur lors du chargement du panier')
        }
        const data = (await res.json()) as CartResponse
        setCart(data)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Erreur inconnue')
      } finally {
        setLoading(false)
      }
    }
    run()
  }, [auth.token])

  if (!auth.token) {
    return (
      <div className="app-main app-main-wide">
        <div className="app-main-col">
          <section className="app-card">
            <p className="message">Connecte-toi pour voir ton panier.</p>
          </section>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="app-main app-main-wide">
        <div className="app-main-col">
          <section className="app-card">
            <p className="muted">Chargement du panier...</p>
          </section>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="app-main app-main-wide">
        <div className="app-main-col">
          <section className="app-card">
            <p className="message message-error">{error}</p>
          </section>
        </div>
      </div>
    )
  }

  if (!cart) {
    return (
      <div className="app-main app-main-wide">
        <div className="app-main-col">
          <section className="app-card">
            <p className="muted">Panier vide.</p>
          </section>
        </div>
      </div>
    )
  }

  return (
    <div className="app-main app-main-wide">
      <div className="app-main-col">
        <section className="app-card stack-md">
          <div className="section-header">
            <div>
              <div className="section-kicker">Résumé</div>
              <h2 className="section-title">Panier</h2>
            </div>
          </div>
          {cart.items.length === 0 ? (
            <p className="muted">Ton panier est vide.</p>
          ) : (
            <ul className="list-reset stack-sm">
              {cart.items.map((item) => (
                <li key={item.id} className="pill-ghost">
                  <span className="pill-ghost-strong">Produit #{item.product_id}</span>
                  <span>× {item.quantity}</span>
                </li>
              ))}
            </ul>
          )}
          {cart.items.length > 0 && auth.token && (
            <div className="form-actions">
              <button
                type="button"
                onClick={async () => {
                  try {
                    setMessage(null)
                    const res = await fetch(`${API_BASE_URL}/payments/checkout`, {
                      method: 'POST',
                      headers: {
                        Authorization: `Bearer ${auth.token}`,
                      },
                    })
                    if (!res.ok) {
                      const detail = await res.text()
                      throw new Error(detail || 'Erreur lors de la création du paiement')
                    }
                    const data = (await res.json()) as { url: string }
                    window.location.href = data.url
                  } catch (e) {
                    setMessage(e instanceof Error ? e.message : 'Erreur inconnue')
                  }
                }}
              >
                Procéder au paiement
              </button>
            </div>
          )}
          {message && <p className="message message-error">{message}</p>}
        </section>
      </div>
    </div>
  )
}

type AuthFormProps = {
  onLogin: (token: string, email: string) => void
}

function LoginPage({ onLogin }: AuthFormProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    try {
      setLoading(true)
      setError(null)
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })
      if (!res.ok) {
        throw new Error('Email ou mot de passe incorrect')
      }
      const data = (await res.json()) as { access_token: string }
      onLogin(data.access_token, email)
      navigate('/catalog')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur inconnue')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h2>Connexion</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>
            Email
            <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
          </label>
        </div>
        <div>
          <label>
            Mot de passe
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              required
            />
          </label>
        </div>
        {error && <p>{error}</p>}
        <button type="submit" disabled={loading}>
          {loading ? 'Connexion...' : 'Se connecter'}
        </button>
      </form>
    </div>
  )
}

function RegisterPage({ onLogin }: AuthFormProps) {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [acceptTerms, setAcceptTerms] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!fullName.trim()) {
      setError('Merci de renseigner ton nom complet')
      return
    }
    if (password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères')
      return
    }
    if (!/[0-9]/.test(password)) {
      setError('Le mot de passe doit contenir au moins un chiffre')
      return
    }
    if (password !== confirmPassword) {
      setError('La confirmation du mot de passe ne correspond pas')
      return
    }
    if (!acceptTerms) {
      setError('Tu dois accepter les conditions pour créer un compte')
      return
    }
    try {
      setLoading(true)
      setError(null)
      const res = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, full_name: fullName }),
      })
      if (!res.ok) {
        throw new Error('Erreur lors de la création du compte')
      }
      const data = (await res.json()) as { access_token: string }
      onLogin(data.access_token, email)
      navigate('/catalog')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur inconnue')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="app-main app-main-wide">
      <div className="app-main-col">
        <section className="app-card stack-md">
          <div className="section-header">
            <div>
              <div className="section-kicker">Créer un compte</div>
              <h2 className="section-title">Inscription</h2>
            </div>
          </div>
          <p className="section-subtitle">
            Renseigne quelques informations pour personnaliser ton espace et sauvegarder ton panier.
          </p>
          <form className="stack-md" onSubmit={handleSubmit}>
            <div className="form-field">
              <label>
                Nom complet
                <input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  type="text"
                  autoComplete="name"
                  placeholder="Ex : Mohamed Tahar Hadj-Messaoud"
                  required
                />
              </label>
            </div>
            <div className="form-field">
              <label>
                Email
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  autoComplete="email"
                  required
                />
              </label>
            </div>
            <div className="form-grid">
              <div className="form-field">
                <label>
                  Mot de passe
                  <input
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    type="password"
                    autoComplete="new-password"
                    required
                  />
                </label>
                <p className="field-hint">Min. 8 caractères, dont au moins un chiffre.</p>
              </div>
              <div className="form-field">
                <label>
                  Confirmer le mot de passe
                  <input
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    type="password"
                    autoComplete="new-password"
                    required
                  />
                </label>
              </div>
            </div>
            <label className="checkbox-field">
              <input
                type="checkbox"
                checked={acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
              />
              <span>
                J’accepte les conditions d’utilisation et je comprends que les paiements sont en mode test.
              </span>
            </label>
            {error && <p className="message message-error">{error}</p>}
            <div className="form-actions">
              <button type="submit" disabled={loading}>
                {loading ? 'Inscription...' : 'Créer un compte'}
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
  )
}

function App() {
  const [auth, setAuth] = useState<AuthState>(() => {
    const token = window.localStorage.getItem('auth_token')
    const email = window.localStorage.getItem('auth_email')
    return { token, email }
  })

  const handleLogin = (token: string, email: string) => {
    setAuth({ token, email })
    window.localStorage.setItem('auth_token', token)
    window.localStorage.setItem('auth_email', email)
  }

  const handleLogout = () => {
    setAuth({ token: null, email: null })
    window.localStorage.removeItem('auth_token')
    window.localStorage.removeItem('auth_email')
  }

  return (
    <BrowserRouter>
      <div className="app-shell">
        <header className="app-header">
          <div className="app-header-left">
            <div className="app-logo">
              <div className="app-logo-mark" />
            </div>
            <div className="app-title-group">
              <div className="app-title">PC Gaming Shop</div>
              <div className="app-subtitle">FastAPI · React · Supabase · Stripe</div>
            </div>
          </div>
          <nav className="app-nav">
            <Link to="/" className="app-nav-link app-nav-link-active">
              <span>Accueil</span>
            </Link>
            <Link to="/catalog" className="app-nav-link">
              <span>Catalogue</span>
            </Link>
            <Link to="/cart" className="app-nav-link">
              <span>Panier</span>
            </Link>
          </nav>
          <div className="app-user-panel">
            {auth.token ? (
              <>
                <span className="app-user-email">{auth.email}</span>
                <button type="button" onClick={handleLogout}>
                  Déconnexion
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="app-nav-link">
                  <span>Connexion</span>
                </Link>
                <Link to="/register" className="app-nav-link">
                  <span>Inscription</span>
                </Link>
              </>
            )}
          </div>
        </header>
        <main>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/catalog" element={<CatalogPage auth={auth} />} />
            <Route path="/cart" element={<CartPage auth={auth} />} />
            <Route path="/login" element={<LoginPage onLogin={handleLogin} />} />
            <Route path="/register" element={<RegisterPage onLogin={handleLogin} />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}

export default App
