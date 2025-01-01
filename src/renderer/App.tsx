import {useCallback} from 'react';

import {Input} from '@/components/ui/input';
import {ScrollArea} from '@/components/ui/scroll-area';

import {cn} from '@/lib/utils';
import {createAppActions} from '@/renderer/state/app.actions';
import {getSelectedXlsxFile} from '@/renderer/state/app.selectors';
import {useAppState} from '@/renderer/state/app.state';

import {Downloads} from '@/renderer/Downloads/Downloads';
import {ControlPanel} from '@/renderer/ControlPanel';

export const App = () => {
    const xlsxFile = useAppState(getSelectedXlsxFile);
    const actions = createAppActions(useAppState.getState, useAppState.setState);
    const onFileChange = useCallback(
        (event: React.ChangeEvent<HTMLInputElement>) => {
            const file = event.target.files?.[0];
            if (file) {
                actions.setXlsxFile(file);
            }
        },
        [actions],
    );

    return (
        <div className={cn('grid grid-cols-6 gap-4 h-full p-2')}>
            <div className="col-span-2">
                <Input id="sheets" type="file" onChange={onFileChange} accept=".xlsx, .csv" />
                {xlsxFile && <ControlPanel />}
            </div>
            <div className="col-span-4 h-full overflow-hidden">
                <ScrollArea className="h-full">
                    <Downloads />
                </ScrollArea>
            </div>
        </div>
    );
};
