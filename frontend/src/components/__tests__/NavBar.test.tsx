import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { screen } from '@testing-library/react'
import { render } from '../../test/test-utils'
import NavBar from '../NavBar'

describe('NavBar', () => {
  it('renders navigation bar with brand and links', () => {
    render(<NavBar />)
    
    expect(screen.getByText('ARCHIVED')).toBeInTheDocument()
    expect(screen.getByText('archives')).toBeInTheDocument()
    expect(screen.getByText('profile')).toBeInTheDocument()
    expect(screen.getByText('contact')).toBeInTheDocument()
  })

  it('has correct navigation links', () => {
    render(<NavBar />)
    
    const brandLink = screen.getByText('ARCHIVED')
    const archivesLink = screen.getByText('archives')
    const profileLink = screen.getByText('profile')
    const contactLink = screen.getByText('contact')
    
    expect(brandLink).toHaveAttribute('href', '/')
    expect(archivesLink).toHaveAttribute('href', '/collections')
    expect(profileLink).toHaveAttribute('href', '/profile')
    expect(contactLink).toHaveAttribute('href', '/contact')
  })

  it('applies active class to current page link', () => {
    // Mock useLocation to return /collections path
    vi.mock('react-router-dom', async () => {
      const actual = await vi.importActual('react-router-dom')
      return {
        ...actual,
        useLocation: () => ({ pathname: '/collections' }),
      }
    })

    render(<NavBar />)
    
    const archivesLink = screen.getByText('archives')
    expect(archivesLink).toHaveClass('activeNavLink')
  })

  it('applies active class to profile page when on profile', () => {
    // Mock useLocation to return /profile path
    vi.mock('react-router-dom', async () => {
      const actual = await vi.importActual('react-router-dom')
      return {
        ...actual,
        useLocation: () => ({ pathname: '/profile' }),
      }
    })

    render(<NavBar />)
    
    const profileLink = screen.getByText('profile')
    expect(profileLink).toHaveClass('activeNavLink')
  })

  it('applies active class to contact page when on contact', () => {
    // Mock useLocation to return /contact path
    vi.mock('react-router-dom', async () => {
      const actual = await vi.importActual('react-router-dom')
      return {
        ...actual,
        useLocation: () => ({ pathname: '/contact' }),
      }
    })

    render(<NavBar />)
    
    const contactLink = screen.getByText('contact')
    expect(contactLink).toHaveClass('activeNavLink')
  })

  it('applies active class to archives link when on collection detail page', () => {
    // Mock useLocation to return /collections/123 path
    vi.mock('react-router-dom', async () => {
      const actual = await vi.importActual('react-router-dom')
      return {
        ...actual,
        useLocation: () => ({ pathname: '/collections/123' }),
      }
    })

    render(<NavBar />)
    
    const archivesLink = screen.getByText('archives')
    expect(archivesLink).toHaveClass('activeNavLink')
  })

  it('does not apply active class when on home page', () => {
    // Mock useLocation to return / path
    vi.mock('react-router-dom', async () => {
      const actual = await vi.importActual('react-router-dom')
      return {
        ...actual,
        useLocation: () => ({ pathname: '/' }),
      }
    })

    render(<NavBar />)
    
    const archivesLink = screen.getByText('archives')
    const profileLink = screen.getByText('profile')
    const contactLink = screen.getByText('contact')
    
    expect(archivesLink).not.toHaveClass('activeNavLink')
    expect(profileLink).not.toHaveClass('activeNavLink')
    expect(contactLink).not.toHaveClass('activeNavLink')
  })
})
