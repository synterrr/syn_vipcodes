import {VrpProxy} from '@vrpjs/server'

export function initvRP<T>(): void {
    const vRP = VrpProxy.getInterface('vRP');

    type queryReturns = {
        item: string
        token: string
        money: number
        id: number
        maxuses: number
        quantity: number
        uses: number
    }

    vRP.prepare('Syn/CreateToken', `INSERT INTO syn_tokens(id, token, money, item, quantity, uses, maxuses) VALUES (@id, @token, @money, @item, @quantity, 0, @maxuses)`)
    vRP.prepare('Syn/checkToken', `SELECT * FROM syn_tokens WHERE token = @t`)
    vRP.prepare('Syn/TokenUsed', `UPDATE syn_tokens SET uses = @uses WHERE token = @token`)


    async function checkToken(t: string): Promise<boolean> {
        const query = await vRP.query('Syn/checkToken', {t: t} ) as any
        return query[1] === 1;
    }

    async function returnTokenInfo<T>(t: string): Promise<queryReturns> {
        return await vRP.query('Syn/checkToken', {t: t}) as queryReturns
    }

    function createToken<T>(UID: number, token: string, money: number, item: string, quantity: number, maxuses: number) {
        vRP.execute('Syn/CreateToken', { id: UID, token: token, money: money, item: item, quantity: quantity, maxuses: maxuses})
    }

    async function activateToken<T>(UID: number, token: string) {
        if ( await checkToken(token) ) {
            const data = await returnTokenInfo(token) as any
            const money = data[0][0].money
            const uses = data[0][0].uses
            const maxUses = data[0][0].maxuses
            const player = data[0][0].id
            const item = data[0][0].item
            const quantity = data[0][0].quantity
            if ( uses <= maxUses ) {
                if ( money > 0 ) {
                    vRP.giveMoney(UID, money)
                }
                if ( item && quantity ) {
                    vRP.giveIntenvoryItem(UID, item, quantity)
                }
                const usedToken = uses + 1
                vRP.execute('Syn/TokenUsed', {uses: usedToken, token: token})
            }
        }
    }

    RegisterCommand('createToken', async(source: number, args: string[]) => {
        if ( source > 0 ) {
            const UID = vRP.getUserId(source) as number
            if ( vRP.hasPermission(UID, 'create.token') ) {
                const token = await vRP.prompt(source, 'TOKEN:', '') as string
                if ( token != '' ) {
                    const maxUses = await vRP.prompt(source, 'MAX USES:', '') as string
                    if ( parseInt(maxUses) > 0 ) {
                        const money = await vRP.prompt(source, 'Money:', '') as string
                        const item = await vRP.prompt(source, 'Item:', '') as string
                        if ( item ) {
                            const quantity = await vRP.prompt(source, 'Quantity:', '') as string
                            createToken(UID, token, parseInt(money), item, parseInt(quantity), parseInt(maxUses))
                        }
                    }
                }
            }
        }
    }, false)

    RegisterCommand('redeemToken', async(source: number, args: string[]) => {
        const user_id = vRP.getUserId(source) as number
        const token = await vRP.prompt(source, 'TOKEN:', '') as string
        if ( token != '' ) {
            await activateToken(user_id, token)
        }
    }, false)

}