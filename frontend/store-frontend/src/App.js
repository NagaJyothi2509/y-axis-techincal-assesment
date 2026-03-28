import React, { useEffect, useMemo, useState } from "react";
import { Link as RouterLink, Redirect, Route, Switch, useHistory, useParams } from "react-router-dom";
import {
  Alert,
  AppBar,
  Badge,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Chip,
  Container,
  CssBaseline,
  Divider,
  Grid,
  Link,
  Stack,
  ThemeProvider,
  Toolbar,
  Typography,
  createTheme
} from "@mui/material";
import AddShoppingCartRoundedIcon from "@mui/icons-material/AddShoppingCartRounded";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import ShoppingCartRoundedIcon from "@mui/icons-material/ShoppingCartRounded";
import StorefrontRoundedIcon from "@mui/icons-material/StorefrontRounded";

const API = process.env.REACT_APP_STORE_API || "http://store.myplatform.local:5002";
const LOGIN = process.env.REACT_APP_LOGIN_URL || "http://app.myplatform.local:3001/login";
const AUTH_API = process.env.REACT_APP_AUTH_API || "http://app.myplatform.local:4000";
const DASHBOARD_URL = process.env.REACT_APP_DASHBOARD_URL || "http://dashboard.myplatform.local:3002";
const MAIN_APP_HOME_URL = process.env.REACT_APP_MAIN_APP_HOME_URL || "http://app.myplatform.local:3001/home";
const SESSION_CHECK_INTERVAL_MS = 5000;

const theme = createTheme({
  palette: {
    primary: { main: "#1f2937" },
    secondary: { main: "#d97706" },
    background: { default: "#fffaf0" }
  },
  shape: { borderRadius: 16 },
  typography: {
    fontFamily: "Manrope, system-ui, sans-serif",
    h4: { fontWeight: 800 },
    h5: { fontWeight: 700 }
  }
});

function redirectToLogin() {
  globalThis.location.href = LOGIN;
}

async function apiFetch(path, options = {}) {
  const response = await fetch(`${API}${path}`, {
    credentials: "include",
    ...options
  });
  if (response.status === 401) {
    redirectToLogin();
    throw new Error("Unauthorized");
  }
  return response;
}

function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function check() {
      try {
        const response = await apiFetch("/api/store/me");
        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
        }
      } catch (_error) {
        setUser(null);
      }
      setLoading(false);
    }

    check();

    const intervalId = globalThis.setInterval(check, SESSION_CHECK_INTERVAL_MS);
    globalThis.addEventListener("focus", check);

    return () => {
      globalThis.clearInterval(intervalId);
      globalThis.removeEventListener("focus", check);
    };
  }, []);

  return { user, loading };
}

function Shell({ user, children, onLogout, cartCount }) {
  return (
    <Box className="min-h-screen bg-[radial-gradient(circle_at_top_left,_#ffedd5,_#fffbeb_45%,_#ffffff)]">
      <AppBar position="static" color="transparent" elevation={0} sx={{ borderBottom: "1px solid #fed7aa" }}>
        <Toolbar>
          <Stack direction="row" spacing={1.2} alignItems="center" sx={{ flexGrow: 1 }}>
            <StorefrontRoundedIcon color="secondary" />
            <Box>
              <Typography fontWeight={800}>Marketplace</Typography>
              <Typography variant="caption" color="text.secondary">Hi {user.name}, discover curated picks</Typography>
            </Box>
          </Stack>
          <Stack direction="row" spacing={1}>
            <Button component={RouterLink} to="/products">Products</Button>
            <Button component={RouterLink} to="/cart">
              <Badge badgeContent={cartCount} color="secondary">
                <ShoppingCartRoundedIcon />
              </Badge>
            </Button>
            <Button href={DASHBOARD_URL}>Dashboard</Button>
            <Button href={MAIN_APP_HOME_URL}>Main App</Button>
            <Button color="error" variant="outlined" onClick={onLogout} startIcon={<LogoutRoundedIcon />}>
              Logout
            </Button>
          </Stack>
        </Toolbar>
      </AppBar>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        {children}
      </Container>
    </Box>
  );
}

function Products({ user, onLogout, cartCount }) {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    async function load() {
      try {
        const response = await apiFetch("/api/store/products");
        const payload = await response.json();
        setProducts(payload.products || []);
      } catch (_error) {
        setProducts([]);
      }
    }
    load();
  }, []);

  return (
    <Shell user={user} onLogout={onLogout} cartCount={cartCount}>
      <Stack spacing={3}>
        <Card sx={{ border: "1px solid #fed7aa" }}>
          <CardContent>
            <Typography variant="h4">Product Catalog</Typography>
            <Typography color="text.secondary">Modern essentials picked for teams, creators, and operators.</Typography>
          </CardContent>
        </Card>

        <Grid container spacing={2}>
          {products.map((product) => (
            <Grid item xs={12} sm={6} md={4} key={product.id}>
              <Card sx={{ height: "100%", border: "1px solid #fde68a" }}>
                <CardContent>
                  <Stack spacing={1.2}>
                    <Chip label={`#${product.id}`} sx={{ width: "fit-content" }} />
                    <Typography variant="h6">{product.name}</Typography>
                    <Typography color="text.secondary" sx={{ minHeight: 48 }}>{product.description}</Typography>
                    <Typography variant="h5" color="secondary.main">${product.price}</Typography>
                  </Stack>
                </CardContent>
                <CardActions>
                  <Button component={RouterLink} to={`/products/${product.id}`} variant="contained" size="small">
                    View Details
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Stack>
    </Shell>
  );
}

function ProductDetail({ user, onLogout, cartCount, refreshCart }) {
  const { id } = useParams();
  const history = useHistory();
  const [product, setProduct] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const response = await apiFetch(`/api/store/products/${id}`);
        if (response.ok) {
          const payload = await response.json();
          setProduct(payload.product);
        }
      } catch (_error) {
        setProduct(null);
      }
    }
    load();
  }, [id]);

  async function addToCart() {
    await apiFetch("/api/store/cart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId: product.id, quantity: 1 })
    });
    await refreshCart();
    history.push("/cart");
  }

  return (
    <Shell user={user} onLogout={onLogout} cartCount={cartCount}>
      {!product ? (
        <Alert severity="warning">Unable to load product.</Alert>
      ) : (
        <Card sx={{ border: "1px solid #fdba74" }}>
          <CardContent>
            <Stack spacing={2}>
              <Chip label={`Product ${product.id}`} sx={{ width: "fit-content" }} />
              <Typography variant="h4">{product.name}</Typography>
              <Typography color="text.secondary">{product.description}</Typography>
              <Divider />
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems={{ sm: "center" }}>
                <Typography variant="h5" color="secondary.main">${product.price}</Typography>
                <Button variant="contained" color="secondary" startIcon={<AddShoppingCartRoundedIcon />} onClick={addToCart}>
                  Add to Cart
                </Button>
              </Stack>
            </Stack>
          </CardContent>
        </Card>
      )}
    </Shell>
  );
}

function Cart({ user, onLogout, cart, refreshCart }) {
  const total = useMemo(
    () => cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0),
    [cart]
  );

  async function removeItem(productId) {
    await apiFetch(`/api/store/cart/${productId}`, {
      method: "DELETE"
    });
    await refreshCart();
  }

  return (
    <Shell user={user} onLogout={onLogout} cartCount={cart.length}>
      <Stack spacing={2.5}>
        <Card sx={{ border: "1px solid #fcd34d" }}>
          <CardContent>
            <Typography variant="h4">Your Cart</Typography>
            <Typography color="text.secondary">{cart.length === 0 ? "No items yet." : `${cart.length} item(s) ready for checkout.`}</Typography>
          </CardContent>
        </Card>

        {cart.length === 0 ? <Alert severity="info">Browse products and add your first item.</Alert> : null}

        {cart.map((item) => (
          <Card key={item.product.id} variant="outlined">
            <CardContent>
              <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={2}>
                <Box>
                  <Typography variant="h6">{item.product.name}</Typography>
                  <Typography color="text.secondary">Quantity: {item.quantity}</Typography>
                </Box>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Typography variant="h6">${item.product.price * item.quantity}</Typography>
                  <Button color="error" variant="outlined" onClick={() => removeItem(item.product.id)}>
                    Remove
                  </Button>
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        ))}

        {cart.length > 0 ? (
          <Card sx={{ border: "1px solid #fdba74", bgcolor: "#fff7ed" }}>
            <CardContent>
              <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" spacing={1}>
                <Typography variant="h6">Order Total</Typography>
                <Typography variant="h5" color="secondary.main">${total.toFixed(2)}</Typography>
              </Stack>
            </CardContent>
          </Card>
        ) : null}
      </Stack>
    </Shell>
  );
}

function App() {
  const { user, loading } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);
  const [cart, setCart] = useState([]);

  async function refreshCart() {
    try {
      const response = await apiFetch("/api/store/cart");
      if (response.ok) {
        const payload = await response.json();
        setCart(payload.cart || []);
      }
    } catch (_error) {
      setCart([]);
    }
  }

  useEffect(() => {
    if (user) {
      refreshCart();
    }
  }, [user]);

  const loadingView = useMemo(
    () => (
      <Box sx={{ p: 5 }}>
        <Typography variant="h5">Loading store...</Typography>
      </Box>
    ),
    []
  );

  async function logout() {
    setLoggingOut(true);
    await fetch(`${AUTH_API}/api/auth/logout`, {
      method: "POST",
      credentials: "include"
    });
    redirectToLogin();
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {loading ? loadingView : null}
      {!loading ? (
        loggingOut ? (
          <Box sx={{ p: 5 }}>
            <Typography variant="h5">Logging out...</Typography>
          </Box>
        ) : user ? (
          <Switch>
            <Route
              path="/products/:id"
              render={() => <ProductDetail user={user} onLogout={logout} cartCount={cart.length} refreshCart={refreshCart} />}
            />
            <Route path="/products" render={() => <Products user={user} onLogout={logout} cartCount={cart.length} />} />
            <Route path="/cart" render={() => <Cart user={user} onLogout={logout} cart={cart} refreshCart={refreshCart} />} />
            <Route path="/" render={() => <Redirect to="/products" />} />
          </Switch>
        ) : (
          <Redirect to="/" />
        )
      ) : null}
    </ThemeProvider>
  );
}

export default App;
