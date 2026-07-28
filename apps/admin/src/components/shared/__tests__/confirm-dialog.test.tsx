import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConfirmDialog } from '../confirm-dialog';

describe('ConfirmDialog', () => {
  const defaultProps = {
    open: true,
    onOpenChange: jest.fn(),
    title: 'Confirm Action',
    description: 'Are you sure you want to proceed?',
    onConfirm: jest.fn(),
  };

  it('renders title and description', () => {
    render(<ConfirmDialog {...defaultProps} />);
    expect(screen.getByText('Confirm Action')).toBeInTheDocument();
    expect(screen.getByText('Are you sure you want to proceed?')).toBeInTheDocument();
  });

  it('renders confirm and cancel buttons', () => {
    render(<ConfirmDialog {...defaultProps} />);
    expect(screen.getByRole('button', { name: /confirm/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
  });

  it('renders custom button labels', () => {
    render(
      <ConfirmDialog
        {...defaultProps}
        confirmLabel="Delete"
        cancelLabel="Keep"
      />,
    );
    expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /keep/i })).toBeInTheDocument();
  });

  it('calls onConfirm when confirm is clicked', async () => {
    const onConfirm = jest.fn();
    render(<ConfirmDialog {...defaultProps} onConfirm={onConfirm} />);

    await userEvent.click(screen.getByRole('button', { name: /confirm/i }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('calls onOpenChange with false when cancel is clicked', async () => {
    const onOpenChange = jest.fn();
    render(<ConfirmDialog {...defaultProps} onOpenChange={onOpenChange} />);

    await userEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('disables buttons when loading', () => {
    render(<ConfirmDialog {...defaultProps} loading />);
    expect(screen.getByRole('button', { name: /confirm/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeDisabled();
  });

  it('applies destructive variant to confirm button', () => {
    render(<ConfirmDialog {...defaultProps} variant="destructive" />);
    const confirmButton = screen.getByRole('button', { name: /confirm/i });
    expect(confirmButton).toHaveClass('bg-destructive');
  });
});
