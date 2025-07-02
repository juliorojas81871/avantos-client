import { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Typography,
  Box,
  Divider,
  Dialog as SourceDialog,
  DialogTitle as SourceDialogTitle,
  DialogContent as SourceDialogContent,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import type { FormNode, FormField, PrefillConfig } from '../types';
import { getGlobalData } from '../api/formApi';

interface PrefillModalProps {
  form: FormNode;
  forms: FormNode[];
  open: boolean;
  onClose: () => void;
  onPrefillChange?: (fieldId: string, prefill: PrefillConfig | null) => void;
}

interface PrefillSourceDialogProps {
  open: boolean;
  onClose: () => void;
  field: FormField;
  directDependencies: FormNode[];
  transitiveDependencies: FormNode[];
  globalData: Record<string, any>;
  onSelect: (sourceType: 'form' | 'global', formId: string, fieldId: string) => void;
}

function PrefillSourceDialog({
  open,
  onClose,
  field,
  directDependencies,
  transitiveDependencies,
  globalData,
  onSelect,
}: PrefillSourceDialogProps) {
  return (
    <SourceDialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <SourceDialogTitle>
        Select Prefill Source for {field.name}
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{ position: 'absolute', right: 8, top: 8 }}
        >
          <CloseIcon />
        </IconButton>
      </SourceDialogTitle>
      <SourceDialogContent>
        {/* Direct Dependencies */}
        <Typography variant="h6" gutterBottom>Direct Dependencies</Typography>
        {directDependencies.map(form => (
          <Box key={form.id} sx={{ mb: 2 }}>
            <Typography variant="subtitle1">{form.name}</Typography>
            <List>
              {form.fields.map(f => (
                <ListItem
                  key={f.id}
                  onClick={() => onSelect('form', form.id, f.id)}
                  sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}
                >
                  <ListItemText
                    primary={f.name}
                    secondary={`Type: ${f.type}`}
                  />
                </ListItem>
              ))}
            </List>
          </Box>
        ))}

        <Divider sx={{ my: 2 }} />

        {/* Transitive Dependencies */}
        <Typography variant="h6" gutterBottom>Transitive Dependencies</Typography>
        {transitiveDependencies.map(form => (
          <Box key={form.id} sx={{ mb: 2 }}>
            <Typography variant="subtitle1">{form.name}</Typography>
            <List>
              {form.fields.map(f => (
                <ListItem
                  key={f.id}
                  onClick={() => onSelect('form', form.id, f.id)}
                  sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}
                >
                  <ListItemText
                    primary={f.name}
                    secondary={`Type: ${f.type}`}
                  />
                </ListItem>
              ))}
            </List>
          </Box>
        ))}

        <Divider sx={{ my: 2 }} />

        {/* Global Data */}
        <Typography variant="h6" gutterBottom>Global Properties</Typography>
        {Object.entries(globalData).map(([category, properties]) => (
          <Box key={category} sx={{ mb: 2 }}>
            <Typography variant="subtitle1">{category}</Typography>
            <List>
              {Object.entries(properties as Record<string, any>).map(([key, value]) => (
                <ListItem
                  key={key}
                  onClick={() => onSelect('global', category, key)}
                  sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}
                >
                  <ListItemText
                    primary={key}
                    secondary={`Type: ${typeof value}`}
                  />
                </ListItem>
              ))}
            </List>
          </Box>
        ))}
      </SourceDialogContent>
    </SourceDialog>
  );
}

export default function PrefillModal({ form, forms, open, onClose, onPrefillChange }: PrefillModalProps) {
  const [globalData, setGlobalData] = useState<Record<string, any>>({});
  const [selectedField, setSelectedField] = useState<FormField | null>(null);
  const [sourceDialogOpen, setSourceDialogOpen] = useState(false);

  useEffect(() => {
    const loadGlobalData = async () => {
      const data = await getGlobalData();
      setGlobalData(data);
    };
    loadGlobalData();
  }, []);

  // Find all dependencies (direct and transitive)
  const { directDependencies, transitiveDependencies } = useMemo(() => {
    const direct = new Set<string>();
    const transitive = new Set<string>();
    
    // Helper function to recursively find dependencies
    const findDependencies = (formId: string, isDirectDep: boolean) => {
      const currentForm = forms.find(f => f.id === formId);
      if (!currentForm) return;

      currentForm.dependencies.forEach(depId => {
        if (isDirectDep) {
          direct.add(depId);
        } else {
          transitive.add(depId);
        }
        findDependencies(depId, false);
      });
    };

    // Start with the current form's dependencies
    form.dependencies.forEach(depId => {
      direct.add(depId);
      findDependencies(depId, false);
    });

    // Remove direct dependencies from transitive ones
    direct.forEach(id => transitive.delete(id));

    return {
      directDependencies: forms.filter(f => direct.has(f.id)),
      transitiveDependencies: forms.filter(f => transitive.has(f.id)),
    };
  }, [form, forms]);

  const handleFieldClick = (field: FormField) => {
    if (field.prefill) return; // Don't open dialog if field already has prefill
    setSelectedField(field);
    setSourceDialogOpen(true);
  };

  const handlePrefillSelect = (sourceType: 'form' | 'global', sourceId: string, fieldId: string) => {
    if (!selectedField) return;

    const prefill = {
      sourceType,
      sourceFormId: sourceId,
      sourceFieldId: fieldId,
    };

    onPrefillChange?.(selectedField.id, prefill);
    setSourceDialogOpen(false);
    setSelectedField(null);
  };

  const handleClearPrefill = (field: FormField) => {
    onPrefillChange?.(field.id, null);
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle>
          Configure Prefill - {form.name}
          <IconButton
            aria-label="close"
            onClick={onClose}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <List>
            {form.fields.map(field => (
              <ListItem
                key={field.id}
                onClick={() => handleFieldClick(field)}
                sx={{ cursor: field.prefill ? 'default' : 'pointer' }}
              >
                <ListItemText
                  primary={field.name}
                  secondary={
                    <>
                      Type: {field.type}
                      <br />
                      {field.prefill
                        ? `Prefilled from: ${field.prefill.sourceFormId} - ${field.prefill.sourceFieldId}`
                        : 'No prefill configured'}
                    </>
                  }
                />
                {field.prefill && (
                  <IconButton
                    size="small"
                    aria-label="clear prefill"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleClearPrefill(field);
                    }}
                  >
                    <CloseIcon />
                  </IconButton>
                )}
              </ListItem>
            ))}
          </List>
        </DialogContent>
      </Dialog>

      {selectedField && (
        <PrefillSourceDialog
          open={sourceDialogOpen}
          onClose={() => setSourceDialogOpen(false)}
          field={selectedField}
          directDependencies={directDependencies}
          transitiveDependencies={transitiveDependencies}
          globalData={globalData}
          onSelect={handlePrefillSelect}
        />
      )}
    </>
  );
} 