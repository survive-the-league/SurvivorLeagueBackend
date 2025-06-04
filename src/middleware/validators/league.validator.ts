import { Request, Response, NextFunction } from 'express';
import { CreateLeagueDto } from '../../dto/league.dto';

export const validateCreateLeague = (req: Request, res: Response, next: NextFunction): void => {
    const { name, maxParticipants, startDate, endDate, isPrivate } = req.body;

    if (!name || typeof name !== 'string') {
        res.status(400).json({
            success: false,
            message: 'League name is required and must be a string'
        });
        return;
    }

    if (!maxParticipants || typeof maxParticipants !== 'number' || maxParticipants < 2) {
        res.status(400).json({
            success: false,
            message: 'Max participants must be a number and at least 2'
        });
        return;
    }

    if (!startDate || !endDate) {
        res.status(400).json({
            success: false,
            message: 'Start date and end date are required'
        });
        return;
    }

    if (new Date(startDate) >= new Date(endDate)) {
        res.status(400).json({
            success: false,
            message: 'End date must be after start date'
        });
        return;
    }

    if (typeof isPrivate !== 'boolean') {
        res.status(400).json({
            success: false,
            message: 'isPrivate must be a boolean'
        });
        return;
    }

    if (isPrivate && !req.body.password) {
        res.status(400).json({
            success: false,
            message: 'Password is required for private leagues'
        });
        return;
    }

    next();
}; 