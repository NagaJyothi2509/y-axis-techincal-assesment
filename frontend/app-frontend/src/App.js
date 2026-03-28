import React, { useEffect, useMemo, useState } from "react";
import { Link as RouterLink, Redirect, Route, Switch, useHistory, useLocation } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  CssBaseline,
  Grid,
  Link,
  Paper,
  Stack,
  TextField,
  ThemeProvider,
  Typography,
  createTheme
} from "@mui/material";
import DashboardRoundedIcon from "@mui/icons-material/DashboardRounded";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import ShoppingBagRoundedIcon from "@mui/icons-material/ShoppingBagRounded";

const AUTH_API = process.env.REACT_APP_AUTH_API || "http://app.myplatform.local:4000";
const DASHBOARD_URL = process.env.REACT_APP_DASHBOARD_URL || "http://dashboard.myplatform.local:3002";
const STORE_URL = process.env.REACT_APP_STORE_URL || "http://store.myplatform.local:3003";
const SESSION_CHECK_INTERVAL_MS = 5000;

const theme = createTheme({
  palette: {
    mode: "light",
    primary: { main: "#0f766e" },
    secondary: { main: "#ea580c" },
    background: { default: "#f5f7fb" }
  },
  shape: { borderRadius: 16 },
  typography: {
    fontFamily: "Manrope, system-ui, sans-serif",
    h1: { fontWeight: 800 },
    h2: { fontWeight: 800 },
    h3: { fontWeight: 700 }
  }
});

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

function AppShell({ children }) {
  return (
    <Box className="min-h-screen bg-[radial-gradient(circle_at_top,_#d1fae5,_#f8fafc_50%,_#fff7ed)]">
      <Container maxWidth="lg" sx={{ py: 5 }}>
        {children}
      </Container>
    </Box>
  );
}

function Landing() {
  return (
    <AppShell>
      <Grid container spacing={3}>
        <Grid item xs={12} md={7}>
          <Paper elevation={0} sx={{ p: 4, border: "1px solid #d1fae5", bgcolor: "rgba(255,255,255,0.9)" }}>
            <Stack spacing={2}>
              <Chip label="Multi-App Authentication Platform" sx={{ width: "fit-content", bgcolor: "#ccfbf1" }} />
              <Typography variant="h2">One login. Three apps. Zero friction.</Typography>
              <Typography color="text.secondary">
                Register once, authenticate once, and move between Main, Dashboard, and Store without signing in again.
              </Typography>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
                <Button component={RouterLink} to="/register" variant="contained" size="large">
                  Create Account
                </Button>
                <Button component={RouterLink} to="/login" variant="outlined" size="large">
                  Sign In
                </Button>
              </Stack>
            </Stack>
          </Paper>
        </Grid>
        <Grid item xs={12} md={5}>
          <Card elevation={0} sx={{ border: "1px solid #e2e8f0", height: "100%" }}>
            <CardContent>
              <Stack spacing={2}>
                <Typography variant="h6">Included in this demo</Typography>
                <Chip icon={<DashboardRoundedIcon />} label="Protected Dashboard" variant="outlined" />
                <Chip icon={<ShoppingBagRoundedIcon />} label="Protected Store" variant="outlined" />
                <Chip label="Server-side sessions + shared cookie" variant="outlined" />
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </AppShell>
  );
}

function Register() {
  const history = useHistory();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");

  async function submit(event) {
    event.preventDefault();
    setError("");
    const response = await fetch(`${AUTH_API}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(form)
    });
    const data = await response.json();
    if (!response.ok) {
      setError(data.message || "Registration failed");
      return;
    }
    history.push("/login");
  }

  return (
    <AppShell>
      <Container maxWidth="sm">
        <Paper sx={{ p: 4, border: "1px solid #dbeafe" }}>
          <Stack spacing={2.5} component="form" onSubmit={submit}>
            <Typography variant="h4">Create your account</Typography>
            <TextField
              required
              label="Full Name"
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
            />
            <TextField
              required
              type="email"
              label="Email"
              value={form.email}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
            />
            <TextField
              required
              type="password"
              label="Password"
              value={form.password}
              onChange={(event) => setForm({ ...form, password: event.target.value })}
            />
            {error ? <Alert severity="error">{error}</Alert> : null}
            <Button type="submit" variant="contained" size="large">
              Register
            </Button>
            <Typography color="text.secondary">
              Already have an account? <Link component={RouterLink} to="/login">Sign in</Link>
            </Typography>
          </Stack>
        </Paper>
      </Container>
    </AppShell>
  );
}

function Login({ onLoggedIn }) {
  const history = useHistory();
  const query = useQuery();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");

  async function submit(event) {
    event.preventDefault();
    setError("");
    const response = await fetch(`${AUTH_API}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(form)
    });
    const data = await response.json();
    if (!response.ok) {
      setError(data.message || "Login failed");
      return;
    }
    onLoggedIn(data.user);
    const redirect = query.get("redirect");
    if (redirect) {
      globalThis.location.href = redirect;
      return;
    }
    history.push("/home");
  }

  return (
    <AppShell>
      <Container maxWidth="sm">
        <Paper sx={{ p: 4, border: "1px solid #fde68a" }}>
          <Stack spacing={2.5} component="form" onSubmit={submit}>
            <Typography variant="h4">Welcome back</Typography>
            <Typography color="text.secondary">Sign in to continue across all apps.</Typography>
            <TextField
              required
              type="email"
              label="Email"
              value={form.email}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
            />
            <TextField
              required
              type="password"
              label="Password"
              value={form.password}
              onChange={(event) => setForm({ ...form, password: event.target.value })}
            />
            {error ? <Alert severity="error">{error}</Alert> : null}
            <Button type="submit" variant="contained" size="large">
              Login
            </Button>
            <Typography color="text.secondary">
              New user? <Link component={RouterLink} to="/register">Create account</Link>
            </Typography>
          </Stack>
        </Paper>
      </Container>
    </AppShell>
  );
}

function Home({ user, onLogout }) {
  return (
    <AppShell>
      <Stack spacing={3}>
        <Paper sx={{ p: 4, border: "1px solid #dbeafe" }}>
          <Stack spacing={1}>
            <Typography variant="h3">Hello, {user?.name}</Typography>
            <Typography color="text.secondary">You are signed in across the platform. Choose where to go next.</Typography>
          </Stack>
        </Paper>

        <Grid container spacing={2.5}>
          <Grid item xs={12} md={6}>
            <Card sx={{ border: "1px solid #bfdbfe" }}>
              <CardContent>
                <Stack spacing={2}>
                  <DashboardRoundedIcon color="primary" />
                  <Typography variant="h5">Dashboard</Typography>
                  <Typography color="text.secondary">View metrics, performance cards, and activity feed.</Typography>
                  <Button variant="contained" href={DASHBOARD_URL}>Open Dashboard</Button>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card sx={{ border: "1px solid #fed7aa" }}>
              <CardContent>
                <Stack spacing={2}>
                  <ShoppingBagRoundedIcon color="secondary" />
                  <Typography variant="h5">Store</Typography>
                  <Typography color="text.secondary">Browse products, check details, and manage your cart.</Typography>
                  <Button color="secondary" variant="contained" href={STORE_URL}>Open Store</Button>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Box>
          <Button startIcon={<LogoutRoundedIcon />} variant="outlined" color="error" onClick={onLogout}>
            Logout Everywhere
          </Button>
        </Box>
      </Stack>
    </AppShell>
  );
}

function App() {
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    async function check() {
      const response = await fetch(`${AUTH_API}/api/auth/validate`, {
        method: "POST",
        credentials: "include"
      });
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      } else {
        setUser(null);
      }
      setAuthChecked(true);
    }

    check();

    const intervalId = globalThis.setInterval(check, SESSION_CHECK_INTERVAL_MS);
    globalThis.addEventListener("focus", check);

    return () => {
      globalThis.clearInterval(intervalId);
      globalThis.removeEventListener("focus", check);
    };
  }, []);

  const loadingView = useMemo(
    () => (
      <AppShell>
        <Paper sx={{ p: 4 }}>
          <Typography variant="h5">Checking session...</Typography>
        </Paper>
      </AppShell>
    ),
    []
  );

  async function logout() {
    await fetch(`${AUTH_API}/api/auth/logout`, {
      method: "POST",
      credentials: "include"
    });
    setUser(null);
    globalThis.location.href = "/login";
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Switch>
        <Route exact path="/" component={Landing} />
        <Route path="/register" component={Register} />
        <Route path="/login" render={() => <Login onLoggedIn={setUser} />} />
        <Route
          path="/home"
          render={() => {
            if (!authChecked) return loadingView;
            if (!user) return <Redirect to="/login" />;
            return <Home user={user} onLogout={logout} />;
          }}
        />
        <Route render={() => <Redirect to="/" />} />
      </Switch>
    </ThemeProvider>
  );
}

export default App;
