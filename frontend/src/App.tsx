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
  product?: {
    name: string
    price: number
    image_url?: string | null
  }
}

type CartResponse = {
  id: number
  items: CartItem[]
}

function HomePage({ auth }: { auth: AuthState }) {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/products`)
        if (res.ok) {
          const data = (await res.json()) as Product[]
          setFeaturedProducts(data.slice(0, 4))
        }
      } catch (e) {
        console.error("Failed to fetch products", e)
      } finally {
        setLoading(false)
      }
    }
    fetchFeatured()
  }, [])

  const handleAddToCart = async (productId: number) => {
    if (!auth.token) {
      navigate('/login')
      return
    }
    try {
      await fetch(`${API_BASE_URL}/cart/items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${auth.token}`,
        },
        body: JSON.stringify({ product_id: productId, quantity: 1 }),
      })
      alert('Produit ajouté au panier !')
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <div className="app-main">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">
            Le futur du <br />
            <span className="text-gradient">Gaming PC</span>
          </h1>
          <p className="hero-subtitle">
            Configure ta machine de rêve avec les meilleurs composants du marché. 
            Performance extrême, design soigné.
          </p>
          <Link to="/catalog" className="hero-cta">
            Voir le catalogue
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
          </Link>
        </div>
      </section>

      {/* Categories */}
      <section>
        <div className="section-heading">
          <h2>Catégories Populaires</h2>
        </div>
        <div className="categories-grid">
          <div className="category-card">
            <div className="category-icon">🎮</div>
            <div className="category-name">Cartes Graphiques</div>
          </div>
          <div className="category-card">
            <div className="category-icon">⚡</div>
            <div className="category-name">Processeurs</div>
          </div>
          <div className="category-card">
            <div className="category-icon">💾</div>
            <div className="category-name">Stockage SSD</div>
          </div>
          <div className="category-card">
            <div className="category-icon">🖥️</div>
            <div className="category-name">Boîtiers</div>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="featured-section">
        <div className="section-heading">
          <h2>Nouveautés</h2>
          <Link to="/catalog" className="section-link">
            Tout voir 
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
          </Link>
        </div>
        
        {loading ? (
          <p className="muted">Chargement...</p>
        ) : (
          <div className="product-grid">
            {featuredProducts.map((p) => (
              <article key={p.id} className="product-card">
                <div className="product-image-container">
                  {p.image_url && (
                    <img className="product-image" src={p.image_url} alt={p.name} />
                  )}
                  <span className="badge-new">NEW</span>
                </div>
                <div className="product-content">
                  <div>
                    <h3 className="product-title">{p.name}</h3>
                  </div>
                  <div className="product-footer">
                    <span className="product-price">{p.price.toFixed(2)} €</span>
                    <button 
                      className="add-to-cart-btn"
                      onClick={() => handleAddToCart(p.id)}
                      disabled={p.stock <= 0}
                    >
                      {p.stock > 0 ? '+' : '×'}
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
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
                <div className="product-image-container">
                  {p.image_url && (
                    <img className="product-image" src={p.image_url} alt={p.name} />
                  )}
                </div>
                <div className="product-content">
                  <div className="stack-sm">
                    <h3 className="product-name">{p.name}</h3>
                    <p className="product-price">{p.price.toFixed(2)} €</p>
                  </div>
                  <div className="product-footer">
                    <div className="pill">
                      <span className="pill-dot" />
                      <span>{p.stock > 0 ? `En stock: ${p.stock}` : 'Rupture'}</span>
                    </div>
                    {p.stock > 0 ? (
                      <button className="add-to-cart-btn" onClick={() => handleAddToCart(p.id)}>
                        Ajouter
                      </button>
                    ) : (
                      <button className="add-to-cart-btn" disabled>
                        Indisponible
                      </button>
                    )}
                  </div>
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

function CartPage({ auth, onLogout }: { auth: AuthState, onLogout: () => void }) {
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
        if (res.status === 401) {
          onLogout()
          throw new Error('Session expirée. Veuillez vous reconnecter.')
        }
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
  }, [auth.token, onLogout])

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
            <div className="cart-container">
              <ul className="cart-list">
                {cart.items.map((item) => (
                  <li key={item.id} className="cart-item">
                    <div className="cart-item-visual">
                      {item.product?.image_url ? (
                        <img src={item.product.image_url} alt={item.product.name} className="cart-thumb" />
                      ) : (
                        <div className="cart-thumb-placeholder" />
                      )}
                    </div>
                    <div className="cart-item-info">
                      <h3 className="cart-item-title">{item.product?.name || `Produit #${item.product_id}`}</h3>
                      <div className="cart-item-meta">
                        <span className="pill-ghost">Qté: {item.quantity}</span>
                        <span className="cart-item-price">
                          {item.product ? `${item.product.price.toFixed(2)} €` : ''}
                        </span>
                      </div>
                    </div>
                    <div className="cart-item-total">
                      {item.product ? (item.product.price * item.quantity).toFixed(2) : '0.00'} €
                    </div>
                  </li>
                ))}
              </ul>
              <div className="cart-summary">
                <div className="cart-total-row">
                  <span>Total</span>
                  <span className="cart-total-amount">
                    {cart.items
                      .reduce((acc, item) => acc + (item.product?.price || 0) * item.quantity, 0)
                      .toFixed(2)}{' '}
                    €
                  </span>
                </div>
              </div>
            </div>
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
            <Route path="/" element={<HomePage auth={auth} />} />
            <Route path="/catalog" element={<CatalogPage auth={auth} />} />
            <Route path="/cart" element={<CartPage auth={auth} onLogout={handleLogout} />} />
            <Route path="/login" element={<LoginPage onLogin={handleLogin} />} />
            <Route path="/register" element={<RegisterPage onLogin={handleLogin} />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}

export default App
