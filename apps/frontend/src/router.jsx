import React, { createContext, useContext, useState, useEffect } from 'react';

const RouterContext = createContext({
  pathname: window.location.pathname,
  navigate: () => {},
});

export const RouterProvider = ({ children }) => {
  const [pathname, setPathname] = useState(window.location.pathname);

  useEffect(() => {
    const handleLocationChange = () => {
      setPathname(window.location.pathname);
    };

    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('locationchange', handleLocationChange);

    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('locationchange', handleLocationChange);
    };
  }, []);

  const navigate = (to) => {
    if (window.location.pathname !== to) {
      window.history.pushState({}, '', to);
      window.dispatchEvent(new Event('locationchange'));
    }
  };

  return (
    <RouterContext.Provider value={{ pathname, navigate }}>
      {children}
    </RouterContext.Provider>
  );
};

export const useLocation = () => {
  const context = useContext(RouterContext);
  return { pathname: context ? context.pathname : window.location.pathname };
};

export const useNavigate = () => {
  const context = useContext(RouterContext);
  return context ? context.navigate : (to) => {
    window.history.pushState({}, '', to);
    window.dispatchEvent(new Event('locationchange'));
  };
};

export const Link = ({ to, children, className, style, onClick, ...props }) => {
  const navigate = useNavigate();

  const handleClick = (e) => {
    if (onClick) onClick(e);

    // Only intercept normal left clicks on internal relative paths
    if (
      !e.defaultPrevented &&
      e.button === 0 &&
      !e.metaKey &&
      !e.altKey &&
      !e.ctrlKey &&
      !e.shiftKey &&
      to &&
      to.startsWith('/')
    ) {
      e.preventDefault();
      navigate(to);
    }
  };

  return (
    <a href={to} className={className} style={style} onClick={handleClick} {...props}>
      {children}
    </a>
  );
};
