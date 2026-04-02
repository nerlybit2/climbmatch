import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ProfileModal } from '@/components/ProfileModal'
import type { Profile } from '@/lib/types/database'

vi.mock('next/image', () => ({
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => <img {...props} />,
}))

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeProfile(overrides: Partial<Profile> = {}): Profile {
  return {
    id: 'u1',
    display_name: 'Alex Honnold',
    photo_url: null,
    bio: 'Free soloist',
    home_area: 'Yosemite',
    climbing_types: ['sport'],
    experience_level: 'advanced',
    sport_grade_range: '8a',
    boulder_grade_range: 'V10',
    weight_kg: 70,
    share_weight: true,
    gear: { rope: true, quickdraws: true, belayDevice: false, crashPad: false, helmet: true },
    has_car: false,
    languages: ['English'],
    created_at: '',
    updated_at: '',
    ...overrides,
  } as unknown as Profile
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ProfileModal', () => {
  const onClose = vi.fn()

  beforeEach(() => vi.clearAllMocks())

  describe('profile data', () => {
    it('renders the climber name in the header', () => {
      render(<ProfileModal profile={makeProfile()} onClose={onClose} />)
      expect(screen.getByRole('heading', { name: /alex honnold/i })).toBeTruthy()
    })

    it('renders bio when provided', () => {
      render(<ProfileModal profile={makeProfile({ bio: 'Free soloist' })} onClose={onClose} />)
      expect(screen.getByText('Free soloist')).toBeTruthy()
    })

    it('does not render bio section when bio is null', () => {
      render(<ProfileModal profile={makeProfile({ bio: null })} onClose={onClose} />)
      expect(screen.queryByText('Free soloist')).toBeNull()
    })

    it('renders home area stat', () => {
      render(<ProfileModal profile={makeProfile()} onClose={onClose} />)
      expect(screen.getByText('Yosemite')).toBeTruthy()
    })

    it('renders sport and boulder grades', () => {
      render(<ProfileModal profile={makeProfile()} onClose={onClose} />)
      expect(screen.getByText('8a')).toBeTruthy()
      expect(screen.getByText('V10')).toBeTruthy()
    })

    it('renders weight when share_weight is true', () => {
      render(<ProfileModal profile={makeProfile({ weight_kg: 70, share_weight: true })} onClose={onClose} />)
      expect(screen.getByText('70 kg')).toBeTruthy()
    })

    it('hides weight when share_weight is false', () => {
      render(<ProfileModal profile={makeProfile({ weight_kg: 70, share_weight: false })} onClose={onClose} />)
      expect(screen.queryByText('70 kg')).toBeNull()
    })

    it('renders gear tags for owned gear', () => {
      render(<ProfileModal profile={makeProfile()} onClose={onClose} />)
      expect(screen.getByText('Rope')).toBeTruthy()
      expect(screen.getByText('Quickdraws')).toBeTruthy()
      expect(screen.getByText('Helmet')).toBeTruthy()
      expect(screen.queryByText('Belay device')).toBeNull()
      expect(screen.queryByText('Crash pad')).toBeNull()
    })

    it('does not render gear section when gear object is empty', () => {
      render(<ProfileModal profile={makeProfile({ gear: {} })} onClose={onClose} />)
      expect(screen.queryByText(/gear they have/i)).toBeNull()
    })
  })

  describe('close behaviour', () => {
    it('calls onClose when the backdrop is clicked', () => {
      const { container } = render(<ProfileModal profile={makeProfile()} onClose={onClose} />)
      fireEvent.click(container.firstChild as HTMLElement)
      expect(onClose).toHaveBeenCalledTimes(1)
    })

    it('calls onClose when the X button is clicked', () => {
      render(<ProfileModal profile={makeProfile()} onClose={onClose} />)
      fireEvent.click(screen.getAllByRole('button')[0])
      expect(onClose).toHaveBeenCalledTimes(1)
    })

    it('does NOT call onClose when the inner sheet is clicked', () => {
      render(<ProfileModal profile={makeProfile()} onClose={onClose} />)
      fireEvent.click(screen.getByRole('heading', { name: /alex honnold/i }))
      expect(onClose).not.toHaveBeenCalled()
    })
  })

  describe('contact buttons', () => {
    it('renders WhatsApp and SMS links when phone is provided', () => {
      render(<ProfileModal profile={makeProfile()} phone="+972501234567" onClose={onClose} />)
      expect(screen.getByRole('link', { name: /whatsapp/i })).toBeTruthy()
      expect(screen.getByRole('link', { name: /sms/i })).toBeTruthy()
    })

    it('WhatsApp link includes location in message when location prop is set', () => {
      render(
        <ProfileModal profile={makeProfile()} phone="+972501234567" location="Siurana" onClose={onClose} />
      )
      const link = screen.getByRole('link', { name: /whatsapp/i }) as HTMLAnchorElement
      expect(link.href).toContain('Siurana')
    })

    it('WhatsApp link uses generic message when no location given', () => {
      render(<ProfileModal profile={makeProfile()} phone="+972501234567" onClose={onClose} />)
      const link = screen.getByRole('link', { name: /whatsapp/i }) as HTMLAnchorElement
      expect(link.href).toContain('ClimbMatch')
      expect(link.href).not.toContain('Siurana')
    })

    it('renders Instagram link when instagram is provided', () => {
      render(<ProfileModal profile={makeProfile()} instagram="@alexhonnold" onClose={onClose} />)
      expect(screen.getByRole('link', { name: /@alexhonnold/i })).toBeTruthy()
    })

    it('renders Facebook link when facebook is provided', () => {
      render(<ProfileModal profile={makeProfile()} facebook="alex.honnold" onClose={onClose} />)
      expect(screen.getByRole('link', { name: /facebook/i })).toBeTruthy()
    })

    it('hides contact section entirely when no contact info is provided', () => {
      render(<ProfileModal profile={makeProfile()} onClose={onClose} />)
      expect(screen.queryByText('Contact')).toBeNull()
      expect(screen.queryByRole('link', { name: /whatsapp/i })).toBeNull()
    })
  })

  describe('z-index and positioning fix', () => {
    it('backdrop has z-[60] so it renders above the z-50 navbar', () => {
      const { container } = render(<ProfileModal profile={makeProfile()} onClose={onClose} />)
      const backdrop = container.firstChild as HTMLElement
      expect(backdrop.className).toContain('z-[60]')
    })

    it('backdrop has pb-[80px] so the sheet clears the navbar', () => {
      const { container } = render(<ProfileModal profile={makeProfile()} onClose={onClose} />)
      const backdrop = container.firstChild as HTMLElement
      expect(backdrop.className).toContain('pb-[80px]')
    })
  })
})
