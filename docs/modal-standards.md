# Modal Standards (2025)

## 🏆 **Standard: Radix UI Dialog**

**Why Radix UI:**
- ✅ Built-in accessibility (ARIA, focus management, ESC key)
- ✅ TypeScript native with full type safety
- ✅ Already installed (`@radix-ui/react-dialog`)
- ✅ Consistent with shadcn/ui patterns
- ✅ Production-tested (used by Vercel, Linear, etc.)

## 📋 **Implementation Pattern**

### 1. Use the Dialog UI Component

```tsx
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
```

### 2. Standard Modal Structure

```tsx
interface MyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // ... other props
}

export function MyModal({ open, onOpenChange, ...props }: MyModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Modal Title</DialogTitle>
          <DialogDescription>
            Optional description text
          </DialogDescription>
        </DialogHeader>
        
        {/* Modal body content */}
        <div className="space-y-4">
          {/* Content here */}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleAction}>
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

### 3. Parent Component Usage

```tsx
export function ParentComponent() {
  const [showModal, setShowModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  const handleOpenModal = (item) => {
    setSelectedItem(item);
    setShowModal(true);
  };

  return (
    <>
      <Button onClick={() => handleOpenModal(item)}>
        Open Modal
      </Button>

      {selectedItem && (
        <MyModal
          open={showModal}
          onOpenChange={(open) => {
            setShowModal(open);
            if (!open) setSelectedItem(null);
          }}
          item={selectedItem}
        />
      )}
    </>
  );
}
```

## 🎨 **Design Guidelines**

### Modal Sizing
- **Small**: `sm:max-w-sm` - Simple confirmations
- **Medium**: `sm:max-w-md` - Standard forms/dialogs  
- **Large**: `sm:max-w-lg` - Complex forms
- **Extra Large**: `sm:max-w-2xl` - Data tables/previews

### Common Patterns

**Confirmation Dialog:**
```tsx
<DialogContent className="sm:max-w-md">
  <DialogHeader>
    <DialogTitle>Confirm Action</DialogTitle>
    <DialogDescription>
      Are you sure you want to continue?
    </DialogDescription>
  </DialogHeader>
  <DialogFooter>
    <Button variant="outline">Cancel</Button>
    <Button variant="destructive">Delete</Button>
  </DialogFooter>
</DialogContent>
```

**Form Dialog:**
```tsx
<DialogContent className="sm:max-w-lg">
  <DialogHeader>
    <DialogTitle>Create Item</DialogTitle>
  </DialogHeader>
  <form onSubmit={handleSubmit}>
    <div className="space-y-4">
      {/* Form fields */}
    </div>
    <DialogFooter>
      <Button type="button" variant="outline">Cancel</Button>
      <Button type="submit">Save</Button>
    </DialogFooter>
  </form>
</DialogContent>
```

## ✅ **Benefits**

- **Automatic**: ESC key closes, click outside closes, focus trapping
- **Accessible**: Screen reader support, proper ARIA attributes  
- **Consistent**: Same API across all modals
- **Type Safe**: Full TypeScript support
- **Performant**: Portal rendering, efficient animations

## 🚫 **Avoid**

- Manual `<div>` overlays with `position: fixed`
- Native `<dialog>` element (browser inconsistencies)
- Third-party modal libraries
- Custom focus management (Radix handles it)

---

**Example Reference**: See `DeleteProjectModal.tsx` for full implementation