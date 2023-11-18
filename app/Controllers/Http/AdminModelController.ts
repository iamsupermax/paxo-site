import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { LucidModel } from '@ioc:Adonis/Lucid/Orm'

import Tutorial from 'App/Models/Tutorial'
import PressArticle from 'App/Models/PressArticle'
import Project from 'App/Models/Project'

export const models: { [key: string]: LucidModel } = { // Models available in the admin panel
  Tutorial,
  PressArticle,
  Project
}

export default class AdminModelController {
  public async index({ params, request, view }: HttpContextContract) {
    const items = await models[params.model].query()
      .paginate(request.input('page', 1), 5)

    return view.render('adminmodel/index', {
      model: params.model,
      items: items.map((val) => val.toJSON())
    })
  }

  public async create({ params, view }: HttpContextContract) {
    const fields: string[] = []
    models[params.model].$columnsDefinitions.forEach((val) => {
      if (val.isPrimary) return
      fields.push(val.columnName)
    })

    return view.render('adminmodel/create', {
      model: params.model,
      fields
    })
  }

  public async createProcess({ params, response, request }: HttpContextContract) {
    const item = await models[params.model].create(request.body())

    return response.redirect().toRoute('adminPanel.model.view', {
      model: params.model,
      id: item.$getAttribute("id"),
    })
  }

  public async injectProcess({ params, response, request }: HttpContextContract) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any[] = request.input("data")
    for (const entry of data) {
      if (entry.id) await models[params.model].updateOrCreate({ id: entry.id }, entry)
      else await models[params.model].create(entry)
    }

    return response.status(201)
  }

  public async view({ params, view }: HttpContextContract) {
    const item = await models[params.model].query()
      .where('id', params.id)
      .firstOrFail()

    return view.render('adminmodel/view', {
      model: params.model,
      item: item.toJSON()
    })
  }

  public async update({ params, view }: HttpContextContract) {
    const item = await models[params.model].query()
      .where('id', params.id)
      .firstOrFail()

    return view.render('adminmodel/update', {
      model: params.model,
      item: item.toJSON(),
      id: params.id,
    })
  }

  public async updateProcess({ bouncer, params, response, request }: HttpContextContract) {
    const item = await models[params.model].query()
      .where('id', params.id)
      .firstOrFail()

    // If user is editing a User, change the authorize rule (custom rule for user editing)
    if (!process.env.UNSAFE_ADMIN_PANEL) {
      if (params.model == "User") {
        await bouncer.authorize('editUserOnAdminPanel', item)
      } else {
        await bouncer.authorize('editModelOnAdminPanel', item)
      }
    }

    await Object.assign(item, request.body()).save()

    return response.redirect().toRoute('adminPanel.model.view', {
      model: params.model,
      id: params.id,
    })
  }

  public async deleteProcess({ bouncer, params, response }: HttpContextContract) {
    const item = await models[params.model].query()
      .where('id', params.id)
      .firstOrFail()

    // If user is editing a User, change the authorize rule (custom rule for user editing)
    if (!process.env.UNSAFE_ADMIN_PANEL) {
      if (params.model == "User") {
        await bouncer.authorize('editUserOnAdminPanel', item)
      } else {
        await bouncer.authorize('editModelOnAdminPanel', item)
      }
    }

    await item.delete()
    return response.redirect().toRoute('adminPanel.model.index', {
      model: params.model
    })
  }
}
