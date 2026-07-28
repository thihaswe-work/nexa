import { render, screen } from '@testing-library/react';
import { StatusBadge } from '../status-badge';

describe('StatusBadge', () => {
  it('renders active status', () => {
    render(<StatusBadge status="active" />);
    const badge = screen.getByText('Active');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('bg-emerald-500/10');
  });

  it('renders banned status', () => {
    render(<StatusBadge status="banned" />);
    const badge = screen.getByText('Banned');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('bg-red-500/10');
  });

  it('renders pending status', () => {
    render(<StatusBadge status="pending" />);
    expect(screen.getByText('Pending')).toBeInTheDocument();
  });

  it('renders resolved status', () => {
    render(<StatusBadge status="resolved" />);
    expect(screen.getByText('Resolved')).toBeInTheDocument();
  });

  it('renders dismissed status', () => {
    render(<StatusBadge status="dismissed" />);
    expect(screen.getByText('Dismissed')).toBeInTheDocument();
  });

  it('renders draft status', () => {
    render(<StatusBadge status="draft" />);
    expect(screen.getByText('Draft')).toBeInTheDocument();
  });

  it('renders published status', () => {
    render(<StatusBadge status="published" />);
    expect(screen.getByText('Published')).toBeInTheDocument();
  });

  it('capitalizes and formats snake_case status', () => {
    render(<StatusBadge status="super_admin" />);
    expect(screen.getByText('Super admin')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(<StatusBadge status="active" className="extra-class" />);
    expect(screen.getByText('Active')).toHaveClass('extra-class');
  });

  it('falls back to default style for unknown status', () => {
    render(<StatusBadge status="custom_status" />);
    const badge = screen.getByText('Custom status');
    expect(badge).toHaveClass('bg-gray-500/10');
  });
});
